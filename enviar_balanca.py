#!/usr/bin/env python3
"""
Envia produtos para a balança Toledo Prix 4 Uno via IT400M (USB serial).
Uso: python3 enviar_balanca.py [PORTA] [ARQUIVO]
  PORTA  : ex. /dev/cu.usbserial-1410  (padrão: auto-detecta)
  ARQUIVO: ex. arquivo de produtos MGV7 (padrão: baixa do sistema)
"""

import sys
import os
import time
import glob
import json
import serial
import urllib.request
import urllib.error

# --------------------------------------------------------------------------
# Configuração
# --------------------------------------------------------------------------
API_BASE  = "http://localhost:3001/api"
API_URL   = f"{API_BASE}/products/export/balanca"
API_EMAIL = "admin@panificadora.com"
API_PASS  = "Admin@123"
BAUD_RATE = 9600        # Toledo Prix padrão; tente 19200 se não funcionar
TIMEOUT   = 3           # segundos de espera por resposta

ACK = b'\x06'
NAK = b'\x15'
ENQ = b'\x05'
STX = b'\x02'
ETX = b'\x03'

# --------------------------------------------------------------------------
# Detecção de porta USB serial
# --------------------------------------------------------------------------
def detectar_porta():
    candidatos = (
        glob.glob('/dev/cu.usbserial*') +
        glob.glob('/dev/cu.usbmodem*') +
        glob.glob('/dev/cu.PL2303*') +
        glob.glob('/dev/cu.SLAB_USBtoUART*') +
        glob.glob('/dev/cu.wchusbserial*')
    )
    if not candidatos:
        return None
    if len(candidatos) == 1:
        return candidatos[0]
    print("Múltiplas portas detectadas:")
    for i, p in enumerate(candidatos):
        print(f"  [{i}] {p}")
    idx = int(input("Escolha o número da porta: "))
    return candidatos[idx]

# --------------------------------------------------------------------------
# Login e download do arquivo via API
# --------------------------------------------------------------------------
def obter_token():
    payload = json.dumps({"email": API_EMAIL, "password": API_PASS}).encode()
    req = urllib.request.Request(f"{API_BASE}/auth/login", data=payload,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return data["accessToken"]
    except Exception as e:
        print(f"ERRO ao fazer login: {e}")
        sys.exit(1)

def baixar_itensmgv():
    print("Autenticando no sistema ...")
    token = obter_token()
    print(f"Baixando produtos de {API_URL} ...")
    req = urllib.request.Request(API_URL)
    req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            conteudo = resp.read().decode('latin-1')
        print(f"  {len(conteudo.splitlines())} produto(s) encontrado(s).")
        return conteudo
    except urllib.error.URLError as e:
        print(f"ERRO ao conectar no sistema: {e}")
        print("Verifique se o backend está rodando (cd backend && npm run start:dev)")
        sys.exit(1)

# --------------------------------------------------------------------------
# Leitura do arquivo local
# --------------------------------------------------------------------------
def ler_arquivo(caminho):
    with open(caminho, 'r', encoding='latin-1') as f:
        return f.read()

# --------------------------------------------------------------------------
# Envio linha a linha com ACK/NAK (protocolo MGV6 serial)
# --------------------------------------------------------------------------
def enviar_mgv6(porta, conteudo):
    linhas = [l for l in conteudo.splitlines() if l.strip()]
    total  = len(linhas)

    print(f"\nConectando em {porta} ({BAUD_RATE},8,N,1) ...")
    try:
        ser = serial.Serial(porta, BAUD_RATE, bytesize=8, parity='N',
                            stopbits=1, timeout=TIMEOUT, rtscts=False, xonxoff=False)
    except serial.SerialException as e:
        print(f"ERRO ao abrir porta: {e}")
        sys.exit(1)

    time.sleep(1)
    ser.reset_input_buffer()
    ser.reset_output_buffer()

    # Handshake inicial: ENQ → espera STX da balança
    print("Enviando ENQ para iniciar comunicação...")
    ser.write(ENQ)
    ser.flush()
    resp_enq = ser.read(1)
    if resp_enq == STX:
        print("Balança pronta (STX recebido). Iniciando envio...")
    elif resp_enq == ACK:
        print("Balança pronta (ACK recebido). Iniciando envio...")
    elif resp_enq == b'':
        print("Sem resposta ao ENQ — continuando mesmo assim...")
    else:
        print(f"Resposta inesperada ao ENQ: {resp_enq.hex()} — continuando...")

    erros = 0
    for i, linha in enumerate(linhas, 1):
        dados = linha.encode('latin-1') + b'\r\n'
        tentativas = 0

        while tentativas < 3:
            ser.write(dados)
            ser.flush()

            resp = ser.read(1)

            if resp in (ACK, STX, b'0'):
                # b'0' (0x30) = confirmação da Prix 3 Fit
                break
            elif resp == NAK:
                tentativas += 1
                print(f"  NAK na linha {i} — retentando ({tentativas}/3)...")
                time.sleep(0.2)
            elif resp == b'':
                # timeout sem resposta — continuar
                break
            else:
                break
        else:
            print(f"  FALHA definitiva na linha {i}: {linha[:30]}...")
            erros += 1

        # progresso
        if i % 10 == 0 or i == total:
            pct = int(i / total * 100)
            barra = '#' * (pct // 5) + '-' * (20 - pct // 5)
            print(f"\r  [{barra}] {pct:3d}%  {i}/{total}", end='', flush=True)

    print()  # nova linha após barra de progresso
    ser.close()
    return erros

# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def main():
    args = sys.argv[1:]

    # Determina arquivo
    if len(args) >= 2:
        arquivo = args[1]
        conteudo = ler_arquivo(arquivo)
        print(f"Usando arquivo local: {arquivo}")
    else:
        conteudo = baixar_itensmgv()

    # Determina porta
    if len(args) >= 1:
        porta = args[0]
    else:
        porta = detectar_porta()
        if not porta:
            print("\nNenhuma porta USB serial detectada.")
            print("Verifique se o IT400M está ligado e conectado via USB.")
            print("Se necessário instale o driver: https://www.prolific.com.tw/US/ShowProduct.aspx?p_id=229")
            sys.exit(1)
        print(f"Porta detectada automaticamente: {porta}")

    erros = enviar_mgv6(porta, conteudo)

    if erros == 0:
        print("\nTransferência concluída com sucesso!")
        print("Na balança: Menu > Programação > Receber Itens (ou Comunicação > Receber)")
    else:
        print(f"\nTransferência concluída com {erros} erro(s).")
        print("Verifique se a balança está no modo de recebimento de itens.")

if __name__ == '__main__':
    main()
