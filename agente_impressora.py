#!/usr/bin/env python3
"""
Agente local de impressão — Casa Granella v2.0
Escuta em http://localhost:9100 e imprime cupons na Bematech MP-4200 HS via porta serial (COM).

A impressora aparece no Windows como "Dispositivo Serial USB (COMx)".
Comunicação direta via pyserial — não requer driver de impressora.

Dependências:
  pip install pyserial

Para gerar o .exe:
  pip install pyinstaller pyserial
  pyinstaller --onefile --noconsole agente_impressora.py
"""

import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime

import serial
import serial.tools.list_ports

PORT     = 9100
BAUD     = 115200  # padrão Bematech MP-4200 HS via USB-Serial

# Termos que identificam a porta da Bematech (case-insensitive)
# O Windows costuma descrever como "USB Serial Device" ou similar
_COM_KEYWORDS = ['bematech', 'mp-4200', 'mp4200', 'usb serial', 'usb-serial',
                 'ch340', 'cp210', 'ft232', 'prolific', 'cdc']

def _detect_com_port():
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        desc = f'{p.description} {p.manufacturer or ""}'.lower()
        if any(k in desc for k in _COM_KEYWORDS):
            return p.device, ports
    # fallback: primeira porta COM disponível
    return (ports[0].device if ports else 'COM3'), ports

_com_port, _all_ports = _detect_com_port()

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
CUT          = GS  + b'V\x41\x03'
FEED         = ESC + b'd\x04'

COLS = 48

def line(text=''):
    return text.encode('cp850', errors='replace') + b'\n'

def divider(char='-'):
    return line(char * COLS)

def col2(left, right, width=COLS):
    right = str(right)
    left  = str(left)
    space = width - len(right)
    if len(left) > space - 1:
        left = left[:space - 2] + '.'
    return line(left.ljust(space) + right)

def format_currency(value):
    return f'R$ {float(value):.2f}'.replace('.', ',')

def build_receipt(data: dict, nome_empresa: str = 'PANIFICADORA', subtitulo: str = '') -> bytes:
    buf = bytearray()
    buf += INIT

    buf += ALIGN_CENTER
    buf += DOUBLE_ON
    buf += line(nome_empresa.upper()[:20])
    buf += DOUBLE_OFF
    if subtitulo:
        buf += line(subtitulo[:30])
    buf += line('')
    buf += divider('=')

    now     = datetime.now().strftime('%d/%m/%Y %H:%M')
    sale_id = data.get('id', '')
    buf += ALIGN_LEFT
    buf += line(f'Data: {now}')
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
        detail  = f'  {qty:.3f} {unit} x {format_currency(price)}'
        buf += col2(detail, format_currency(subtotal))
        if discount > 0:
            buf += col2('  Desconto', f'- {format_currency(discount)}')

    buf += divider()

    total_amount = float(data.get('totalAmount', 0))
    discount     = float(data.get('discount', 0))
    final_amount = float(data.get('finalAmount', total_amount - discount))

    if discount > 0:
        buf += col2('Subtotal', format_currency(total_amount))
        buf += col2('Desconto', f'- {format_currency(discount)}')
    buf += BOLD_ON
    buf += col2('TOTAL', format_currency(final_amount))
    buf += BOLD_OFF

    buf += divider()
    method_labels = {
        'CASH': 'Dinheiro', 'CREDIT': 'Cartão Crédito',
        'DEBIT': 'Cartão Débito', 'PIX': 'PIX', 'MIXED': 'Misto',
    }
    for p in data.get('payments', []):
        label = method_labels.get(p.get('method', ''), p.get('method', ''))
        buf += col2(label, format_currency(p.get('amount', 0)))

    change = float(data.get('change', 0))
    if change > 0:
        buf += col2('Troco', format_currency(change))

    buf += divider('=')
    buf += ALIGN_CENTER
    buf += line('Obrigado pela preferencia!')
    buf += line('Volte sempre :)')
    buf += ALIGN_LEFT
    buf += FEED
    buf += CUT

    return bytes(buf)

def build_qr_escpos(url: str, size: int = 4) -> bytes:
    buf = bytearray()
    data = url.encode('ascii', errors='replace')
    n = len(data) + 3
    pL = n & 0xFF
    pH = (n >> 8) & 0xFF
    buf += b'\x1d\x28\x6b\x04\x00\x31\x41\x32\x00'       # model 2
    buf += b'\x1d\x28\x6b\x03\x00\x31\x43' + bytes([size]) # size
    buf += b'\x1d\x28\x6b\x03\x00\x31\x45\x30'            # error correction M
    buf += b'\x1d\x28\x6b' + bytes([pL, pH]) + b'\x31\x50\x30' + data  # store
    buf += b'\x1d\x28\x6b\x03\x00\x31\x51\x30'            # print
    return bytes(buf)

def build_nfce_receipt(data: dict, nome_empresa: str = 'PANIFICADORA', subtitulo: str = '') -> bytes:
    buf = bytearray()
    buf += INIT

    buf += ALIGN_CENTER
    buf += DOUBLE_ON
    buf += line(nome_empresa.upper()[:20])
    buf += DOUBLE_OFF
    if subtitulo:
        buf += line(subtitulo[:30])
    buf += line('')
    buf += divider('=')

    now     = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
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
        detail = f'  {qty:.3f} {unit} x {format_currency(price)}'
        buf += col2(detail, format_currency(subtotal))
        if discount > 0:
            buf += col2('  Desconto', f'- {format_currency(discount)}')

    buf += divider()

    total_amount = float(data.get('totalAmount', 0))
    discount     = float(data.get('discount', 0))
    final_amount = float(data.get('finalAmount', total_amount - discount))

    if discount > 0:
        buf += col2('Subtotal', format_currency(total_amount))
        buf += col2('Desconto', f'- {format_currency(discount)}')
    buf += BOLD_ON
    buf += col2('TOTAL', format_currency(final_amount))
    buf += BOLD_OFF

    buf += divider()
    method_labels = {
        'CASH': 'Dinheiro', 'CREDIT': 'Cartao Credito',
        'DEBIT': 'Cartao Debito', 'PIX': 'PIX', 'MIXED': 'Misto',
    }
    for p in data.get('payments', []):
        label = method_labels.get(p.get('method', ''), p.get('method', ''))
        buf += col2(label, format_currency(p.get('amount', 0)))

    change = float(data.get('change', 0))
    if change > 0:
        buf += col2('Troco', format_currency(change))

    buf += divider('=')

    # Bloco fiscal
    chave = data.get('chaveAcesso', '')
    if chave:
        buf += ALIGN_CENTER
        buf += line('DANFE NFC-e - Documento Auxiliar da')
        buf += line('Nota Fiscal de Consumidor Eletronicа')
        buf += line('')
        # Chave em blocos de 4
        chave_fmt = ' '.join(chave[i:i+4] for i in range(0, len(chave), 4))
        buf += ALIGN_LEFT
        buf += line(chave_fmt[:COLS])
        if len(chave_fmt) > COLS:
            buf += line(chave_fmt[COLS:])

    qrcode_url = data.get('qrcodeUrl', '')
    if qrcode_url:
        buf += ALIGN_CENTER
        buf += line('')
        buf += build_qr_escpos(qrcode_url, size=4)
        buf += line('')
        buf += line('Consulte em: nfce.fazenda.pr.gov.br')

    buf += line('Homologacao - Sem valor fiscal') if data.get('ambiente') == 'homologacao' else line('')
    buf += ALIGN_LEFT
    buf += FEED
    buf += CUT

    return bytes(buf)

def send_to_printer(data: bytes):
    try:
        with serial.Serial(_com_port, BAUD, timeout=3) as s:
            s.write(data)
        return True, f'OK ({_com_port})'
    except Exception as e:
        ports_desc = ', '.join(f'{p.device} ({p.description})' for p in _all_ports)
        msg = f'{e} | Porta usada: {_com_port} | Portas disponíveis: {ports_desc or "nenhuma"}'
        return False, msg

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path not in ('/print', '/print-nfce'):
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get('Content-Length', 0))
        body   = self.rfile.read(length)

        try:
            data    = json.loads(body)
            nome_empresa = data.get('empresaNome', 'PANIFICADORA')
            subtitulo = data.get('subtitulo', '')
            receipt = build_nfce_receipt(data, nome_empresa, subtitulo) if self.path == '/print-nfce' else build_receipt(data, nome_empresa, subtitulo)
            ok, msg = send_to_printer(receipt)
            status  = 200 if ok else 500
            resp    = json.dumps({'ok': ok, 'message': msg}).encode()
        except Exception as e:
            status = 500
            resp   = json.dumps({'ok': False, 'message': str(e)}).encode()

        self.send_response(status)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(resp)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

def main():
    print(f'Agente Casa Granella rodando em http://localhost:{PORT}')
    print(f'Porta serial: {_com_port} ({BAUD} baud)')
    if _all_ports:
        print(f'Portas COM disponíveis: {", ".join(p.device + " (" + p.description + ")" for p in _all_ports)}')
    print('Pressione Ctrl+C para encerrar.')
    server = HTTPServer(('127.0.0.1', PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('Encerrado.')

if __name__ == '__main__':
    main()
