#!/usr/bin/env python3
"""
Agente local de impressão — Panificadora v3.2
Impressora: Golden Sky 80mm (WiFi/Rede ou USB)
Escuta em http://localhost:9100 e envia ESC/POS para a impressora.

Modos suportados:
  wifi   → TCP socket RAW (WiFi ou rede cabeada)
  usb    → impressora USB instalada no Windows via win32print (RAW)
  serial → porta COM / USB com chip serial (CH340, CP210x, etc.)

Dependências:
  pip install pyserial          (modo serial)
  pip install pywin32           (modo usb — Windows only)
  pip install pyinstaller       (para gerar .exe)

Gerar .exe:
  pip install pyinstaller pyserial pywin32
  pyinstaller --onefile --noconsole --hidden-import win32print --hidden-import win32api
              --hidden-import serial --hidden-import serial.tools.list_ports
              agente_impressora.py
"""

import json
import socket
import sys
import threading
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer

import tkinter as tk
from tkinter import messagebox

# ═════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO — edite aqui antes de gerar o .exe
# ═════════════════════════════════════════════════════════════════════════════

AGENT_PORT   = 9100   # porta HTTP deste agente (não altere)

PRINTER_MODE = 'usb'  # 'wifi'    → TCP socket (WiFi ou rede)
                      # 'usb'     → USB Windows via win32print
                      # 'serial'  → porta COM serial

# Modo WiFi / Rede ─────────────────────────────────────────────────────────
PRINTER_IP     = '192.168.1.100'  # << IP da impressora na rede
PRINTER_PORT   = 9100             # porta RAW (padrão Golden Sky rede)
SOCKET_TIMEOUT = 5

# Modo USB ─────────────────────────────────────────────────────────────────
USB_PRINTER_NAME = ''   # vazio = detecta automaticamente
_USB_KEYWORDS    = ['golden', 'sky', 'pos', 'thermal', '80mm', 'receipt', 'cupom']

# Modo Serial / COM ────────────────────────────────────────────────────────
SERIAL_BAUD   = 115200
_COM_KEYWORDS = ['golden', 'sky', 'usb serial', 'ch340', 'cp210', 'ft232', 'prolific', 'cdc']

# ═════════════════════════════════════════════════════════════════════════════

# Estado compartilhado entre o servidor HTTP e a UI
_print_count    = 0
_last_ok        = None   # datetime da última impressão bem-sucedida
_last_error     = None   # mensagem do último erro
_ui_ref         = None   # referência para a janela tkinter

# ESC/POS
ESC = b'\x1b'
GS  = b'\x1d'

INIT         = ESC + b'@'
ALIGN_LEFT   = ESC + b'a\x00'
ALIGN_CENTER = ESC + b'a\x01'
BOLD_ON      = ESC + b'E\x01'
BOLD_OFF     = ESC + b'E\x00'
DOUBLE_ON    = GS  + b'!\x11'
DOUBLE_OFF   = GS  + b'!\x00'
FEED         = ESC + b'd\x04'
CUT          = GS  + b'V\x41\x00'

COLS = 48

def line(text=''):
    return str(text).encode('cp850', errors='replace') + b'\n'

def divider(char='-'):
    return line(char * COLS)

def col2(left, right, width=COLS):
    right = str(right)
    left  = str(left)
    space = width - len(right)
    if len(left) > space - 1:
        left = left[:space - 2] + '.'
    return line(left.ljust(space) + right)

def fmt_currency(value):
    return f'R$ {float(value):.2f}'.replace('.', ',')


# ── Cupom comum ───────────────────────────────────────────────────────────────
def build_receipt(data: dict, nome_empresa: str = 'PANIFICADORA', subtitulo: str = '') -> bytes:
    buf = bytearray()
    buf += INIT
    buf += ALIGN_CENTER
    buf += DOUBLE_ON
    buf += line(nome_empresa.upper()[:20])
    buf += DOUBLE_OFF
    if subtitulo:
        buf += line(subtitulo[:COLS])
    buf += line()
    buf += divider('=')

    now = datetime.now().strftime('%d/%m/%Y %H:%M')
    buf += ALIGN_LEFT
    buf += line(f'Data: {now}')
    sale_id = data.get('id', '')
    if sale_id:
        buf += line(f'Venda: #{sale_id}')
    customer = data.get('customer')
    if customer:
        buf += line(f'Cliente: {customer.get("name", "")}')
    buf += divider()

    buf += BOLD_ON
    buf += col2('PRODUTO', 'SUBTOTAL')
    buf += BOLD_OFF
    buf += divider()

    for item in data.get('items', []):
        name     = item.get('name') or item.get('product', {}).get('name', '')
        qty      = float(item.get('quantity', 0))
        unit     = item.get('unit') or item.get('product', {}).get('unit', '')
        price    = float(item.get('unitPrice', 0))
        subtotal = float(item.get('subtotal', qty * price))
        discount = float(item.get('discount', 0))
        buf += line(name[:COLS])
        buf += col2(f'  {qty:.3f} {unit} x {fmt_currency(price)}', fmt_currency(subtotal))
        if discount > 0:
            buf += col2('  Desconto', f'- {fmt_currency(discount)}')

    buf += divider()

    total    = float(data.get('totalAmount', 0))
    discount = float(data.get('discount', 0))
    final    = float(data.get('finalAmount', total - discount))

    if discount > 0:
        buf += col2('Subtotal', fmt_currency(total))
        buf += col2('Desconto', f'- {fmt_currency(discount)}')
    buf += BOLD_ON
    buf += col2('TOTAL', fmt_currency(final))
    buf += BOLD_OFF

    buf += divider()
    method_labels = {
        'CASH': 'Dinheiro', 'CREDIT': 'Cartao Credito',
        'DEBIT': 'Cartao Debito', 'PIX': 'PIX', 'MIXED': 'Misto',
    }
    for p in data.get('payments', []):
        label = method_labels.get(p.get('method', ''), p.get('method', ''))
        buf += col2(label, fmt_currency(p.get('amount', 0)))
    change = float(data.get('change', 0))
    if change > 0:
        buf += col2('Troco', fmt_currency(change))

    buf += divider('=')
    buf += ALIGN_CENTER
    buf += line('Obrigado pela preferencia!')
    buf += line('Volte sempre :)')
    buf += FEED
    buf += CUT
    return bytes(buf)


# ── QR Code ESC/POS ───────────────────────────────────────────────────────────
def build_qr_escpos(url: str, size: int = 4) -> bytes:
    buf  = bytearray()
    data = url.encode('ascii', errors='replace')
    n    = len(data) + 3
    pL   = n & 0xFF
    pH   = (n >> 8) & 0xFF
    buf += b'\x1d\x28\x6b\x04\x00\x31\x41\x32\x00'
    buf += b'\x1d\x28\x6b\x03\x00\x31\x43' + bytes([size])
    buf += b'\x1d\x28\x6b\x03\x00\x31\x45\x30'
    buf += b'\x1d\x28\x6b' + bytes([pL, pH]) + b'\x31\x50\x30' + data
    buf += b'\x1d\x28\x6b\x03\x00\x31\x51\x30'
    return bytes(buf)


# ── Cupom NFC-e ───────────────────────────────────────────────────────────────
def build_nfce_receipt(data: dict, nome_empresa: str = 'PANIFICADORA', subtitulo: str = '') -> bytes:
    buf = bytearray()
    buf += INIT
    buf += ALIGN_CENTER
    buf += DOUBLE_ON
    buf += line(nome_empresa.upper()[:20])
    buf += DOUBLE_OFF
    if subtitulo:
        buf += line(subtitulo[:COLS])
    buf += line()
    buf += divider('=')

    now = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    buf += ALIGN_LEFT
    buf += line(f'Data: {now}')

    numero = data.get('numeroNota')
    serie  = data.get('serie')
    if numero and serie:
        buf += line(f'NFC-e n\xba {numero} - Serie {serie}')
    cpf = data.get('cpfDestinatario')
    if cpf:
        buf += line(f'CPF: {cpf}')

    buf += divider()
    buf += BOLD_ON
    buf += col2('PRODUTO', 'SUBTOTAL')
    buf += BOLD_OFF
    buf += divider()

    for item in data.get('items', []):
        name     = item.get('name') or item.get('product', {}).get('name', '')
        qty      = float(item.get('quantity', 0))
        unit     = item.get('unit') or item.get('product', {}).get('unit', '')
        price    = float(item.get('unitPrice', 0))
        subtotal = float(item.get('subtotal', qty * price))
        discount = float(item.get('discount', 0))
        buf += line(name[:COLS])
        buf += col2(f'  {qty:.3f} {unit} x {fmt_currency(price)}', fmt_currency(subtotal))
        if discount > 0:
            buf += col2('  Desconto', f'- {fmt_currency(discount)}')

    buf += divider()

    total    = float(data.get('totalAmount', 0))
    discount = float(data.get('discount', 0))
    final    = float(data.get('finalAmount', total - discount))

    if discount > 0:
        buf += col2('Subtotal', fmt_currency(total))
        buf += col2('Desconto', f'- {fmt_currency(discount)}')
    buf += BOLD_ON
    buf += col2('TOTAL', fmt_currency(final))
    buf += BOLD_OFF

    buf += divider()
    method_labels = {
        'CASH': 'Dinheiro', 'CREDIT': 'Cartao Credito',
        'DEBIT': 'Cartao Debito', 'PIX': 'PIX', 'MIXED': 'Misto',
    }
    for p in data.get('payments', []):
        label = method_labels.get(p.get('method', ''), p.get('method', ''))
        buf += col2(label, fmt_currency(p.get('amount', 0)))
    change = float(data.get('change', 0))
    if change > 0:
        buf += col2('Troco', fmt_currency(change))

    buf += divider('=')

    chave = data.get('chaveAcesso', '')
    if chave:
        buf += ALIGN_CENTER
        buf += line('DANFE NFC-e - Documento Auxiliar da')
        buf += line('Nota Fiscal de Consumidor Eletronica')
        buf += line()
        chave_fmt = ' '.join(chave[i:i+4] for i in range(0, len(chave), 4))
        buf += ALIGN_LEFT
        buf += line(chave_fmt[:COLS])
        if len(chave_fmt) > COLS:
            buf += line(chave_fmt[COLS:])

    qrcode_url = data.get('qrcodeUrl', '')
    if qrcode_url:
        buf += ALIGN_CENTER
        buf += line()
        buf += build_qr_escpos(qrcode_url, size=4)
        buf += line()
        buf += line('Consulte: nfce.fazenda.pr.gov.br')

    if data.get('ambiente') == 'homologacao':
        buf += line()
        buf += line('** HOMOLOGACAO - SEM VALOR FISCAL **')

    buf += FEED
    buf += CUT
    return bytes(buf)


# ── Envio para a impressora ───────────────────────────────────────────────────
def send_to_printer(data: bytes):
    if PRINTER_MODE == 'wifi':
        return _send_wifi(data)
    elif PRINTER_MODE == 'usb':
        return _send_usb(data)
    else:
        return _send_serial(data)

def _send_wifi(data: bytes):
    try:
        with socket.create_connection((PRINTER_IP, PRINTER_PORT), timeout=SOCKET_TIMEOUT) as s:
            s.sendall(data)
        return True, f'OK (WiFi/Rede {PRINTER_IP}:{PRINTER_PORT})'
    except Exception as e:
        return False, f'Erro WiFi: {e} | IP: {PRINTER_IP}:{PRINTER_PORT}'

def _find_usb_printer_name():
    if USB_PRINTER_NAME:
        return USB_PRINTER_NAME
    try:
        import win32print
        printers = [p[2] for p in win32print.EnumPrinters(
            win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
        )]
        for name in printers:
            if any(k in name.lower() for k in _USB_KEYWORDS):
                return name
        default = win32print.GetDefaultPrinter()
        return default if default else (printers[0] if printers else None)
    except Exception:
        return None

def _send_usb(data: bytes):
    if sys.platform != 'win32':
        return _send_serial(data)
    try:
        import win32print
        printer_name = _find_usb_printer_name()
        if not printer_name:
            return False, (
                'Impressora USB nao encontrada. '
                'Instale o driver e verifique em Dispositivos e Impressoras. '
                'Ou defina USB_PRINTER_NAME no topo do agente.'
            )
        hPrinter = win32print.OpenPrinter(printer_name)
        try:
            hJob = win32print.StartDocPrinter(hPrinter, 1, ('Cupom', None, 'RAW'))
            try:
                win32print.StartPagePrinter(hPrinter)
                win32print.WritePrinter(hPrinter, data)
                win32print.EndPagePrinter(hPrinter)
            finally:
                win32print.EndDocPrinter(hPrinter)
        finally:
            win32print.ClosePrinter(hPrinter)
        return True, f'OK (USB → {printer_name})'
    except ImportError:
        return False, 'pywin32 nao instalado. Execute: pip install pywin32'
    except Exception as e:
        return False, f'Erro USB: {e}'

def _send_serial(data: bytes):
    try:
        import serial
        import serial.tools.list_ports
        ports = list(serial.tools.list_ports.comports())
        com_port = ports[0].device if ports else 'COM3'
        for p in ports:
            desc = f'{p.description} {p.manufacturer or ""}'.lower()
            if any(k in desc for k in _COM_KEYWORDS):
                com_port = p.device
                break
        with serial.Serial(com_port, SERIAL_BAUD, timeout=3) as s:
            s.write(data)
        return True, f'OK (Serial {com_port})'
    except ImportError:
        return False, 'pyserial nao instalado. Execute: pip install pyserial'
    except Exception as e:
        return False, f'Erro Serial: {e}'


# ── HTTP Handler ──────────────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path != '/status':
            self.send_response(404)
            self.end_headers()
            return

        if PRINTER_MODE == 'wifi':
            info = f'WiFi/Rede → {PRINTER_IP}:{PRINTER_PORT}'
        elif PRINTER_MODE == 'usb':
            name = _find_usb_printer_name() if sys.platform == 'win32' else 'N/A'
            info = f'USB → {name or "nao detectada"}'
        else:
            info = f'Serial → {SERIAL_BAUD} baud'

        resp = json.dumps({
            'ok': True,
            'mode': PRINTER_MODE,
            'info': info,
            'printCount': _print_count,
            'lastPrint': _last_ok.strftime('%H:%M:%S') if _last_ok else None,
        }).encode()
        self.send_response(200)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(resp)

    def do_POST(self):
        global _print_count, _last_ok, _last_error

        if self.path not in ('/print', '/print-nfce'):
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get('Content-Length', 0))
        body   = self.rfile.read(length)

        try:
            data         = json.loads(body)
            nome_empresa = data.get('empresaNome', 'PANIFICADORA')
            subtitulo    = data.get('subtitulo', '')
            if self.path == '/print-nfce':
                receipt = build_nfce_receipt(data, nome_empresa, subtitulo)
            else:
                receipt = build_receipt(data, nome_empresa, subtitulo)
            ok, msg = send_to_printer(receipt)
            if ok:
                _print_count += 1
                _last_ok    = datetime.now()
                _last_error = None
            else:
                _last_error = msg
            status = 200 if ok else 500
            resp   = json.dumps({'ok': ok, 'message': msg}).encode()
        except Exception as e:
            _last_error = str(e)
            status = 500
            resp   = json.dumps({'ok': False, 'message': str(e)}).encode()

        # Atualiza a UI de forma thread-safe
        if _ui_ref is not None:
            _ui_ref.root.after(0, _ui_ref.refresh)

        self.send_response(status)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(resp)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')


# ── Interface gráfica (tkinter) ───────────────────────────────────────────────
class AgenteUI:
    COR_FUNDO  = '#f9fafb'
    COR_VERDE  = '#16a34a'
    COR_CINZA  = '#6b7280'
    COR_ERRO   = '#dc2626'
    COR_BORDA  = '#e5e7eb'

    def __init__(self):
        self.root = tk.Tk()
        self.root.title('Agente de Impressão')
        self.root.geometry('320x170')
        self.root.resizable(False, False)
        self.root.configure(bg=self.COR_FUNDO)
        self.root.protocol('WM_DELETE_WINDOW', self._on_close)

        # Centraliza na tela
        self.root.update_idletasks()
        w = self.root.winfo_width()
        h = self.root.winfo_height()
        x = (self.root.winfo_screenwidth()  // 2) - (w // 2)
        y = (self.root.winfo_screenheight() // 2) - (h // 2)
        self.root.geometry(f'+{x}+{y}')

        self._build()

    def _build(self):
        pad = {'padx': 20, 'pady': 0}

        # ── Cabeçalho ──
        header = tk.Frame(self.root, bg='#ffffff', bd=0,
                          highlightbackground=self.COR_BORDA, highlightthickness=1)
        header.pack(fill='x')

        tk.Label(header, text='🖨  Agente de Impressão',
                 bg='#ffffff', font=('Segoe UI', 11, 'bold'),
                 pady=10).pack(side='left', padx=16)

        # ── Corpo ──
        body = tk.Frame(self.root, bg=self.COR_FUNDO)
        body.pack(fill='both', expand=True, padx=20, pady=12)

        # Status: ponto verde + texto
        row1 = tk.Frame(body, bg=self.COR_FUNDO)
        row1.pack(anchor='w', pady=(0, 4))
        self._dot = tk.Label(row1, text='●', fg=self.COR_VERDE,
                             bg=self.COR_FUNDO, font=('Segoe UI', 13))
        self._dot.pack(side='left')
        tk.Label(row1, text=f'  Rodando na porta {AGENT_PORT}',
                 bg=self.COR_FUNDO, font=('Segoe UI', 10, 'bold')).pack(side='left')

        # Modo
        if PRINTER_MODE == 'wifi':
            modo_txt = f'Modo: WiFi → {PRINTER_IP}:{PRINTER_PORT}'
        elif PRINTER_MODE == 'usb':
            nome = _find_usb_printer_name() if sys.platform == 'win32' else '—'
            modo_txt = f'Modo: USB → {nome or "detectando..."}'
        else:
            modo_txt = f'Modo: Serial ({SERIAL_BAUD} baud)'

        tk.Label(body, text=modo_txt, bg=self.COR_FUNDO,
                 fg=self.COR_CINZA, font=('Segoe UI', 9)).pack(anchor='w')

        # Última impressão
        self._status_var = tk.StringVar(value='Aguardando impressões...')
        self._status_lbl = tk.Label(body, textvariable=self._status_var,
                                    bg=self.COR_FUNDO, fg=self.COR_CINZA,
                                    font=('Segoe UI', 9))
        self._status_lbl.pack(anchor='w', pady=(2, 0))

        # ── Botões ──
        btns = tk.Frame(body, bg=self.COR_FUNDO)
        btns.pack(anchor='w', pady=(12, 0))

        tk.Button(btns, text='Ver status',
                  command=lambda: webbrowser.open(f'http://localhost:{AGENT_PORT}/status'),
                  font=('Segoe UI', 9), relief='flat', bd=0,
                  bg=self.COR_BORDA, activebackground='#d1d5db',
                  padx=10, pady=4, cursor='hand2'
                  ).pack(side='left', padx=(0, 8))

        tk.Button(btns, text='Parar agente',
                  command=self._on_close,
                  font=('Segoe UI', 9), relief='flat', bd=0,
                  fg='white', bg=self.COR_ERRO, activebackground='#b91c1c',
                  padx=10, pady=4, cursor='hand2'
                  ).pack(side='left')

    def refresh(self):
        """Chamado pelo handler HTTP após cada impressão (thread-safe via after())."""
        if _last_error:
            self._status_var.set(f'✗ Erro: {_last_error[:50]}')
            self._status_lbl.config(fg=self.COR_ERRO)
        elif _last_ok:
            hora = _last_ok.strftime('%H:%M:%S')
            self._status_var.set(f'✓ {_print_count} cupom{"ns" if _print_count != 1 else ""} impresso{"s" if _print_count != 1 else ""} · último às {hora}')
            self._status_lbl.config(fg=self.COR_VERDE)

    def _on_close(self):
        if messagebox.askokcancel('Parar agente', 'Deseja parar o agente de impressão?\n\nO PDV não conseguirá imprimir enquanto o agente estiver fechado.'):
            self.root.destroy()
            sys.exit(0)

    def run(self):
        self.root.mainloop()


# ── Inicialização ─────────────────────────────────────────────────────────────
def _start_server():
    server = HTTPServer(('127.0.0.1', AGENT_PORT), Handler)
    server.serve_forever()

def main():
    global _ui_ref

    # Inicia o servidor HTTP em thread daemon
    t = threading.Thread(target=_start_server, daemon=True)
    t.start()

    # Abre a janela (bloqueia aqui até o usuário fechar)
    ui = AgenteUI()
    _ui_ref = ui
    ui.run()

if __name__ == '__main__':
    main()
