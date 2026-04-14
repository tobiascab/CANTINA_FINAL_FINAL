# print-agent.ps1 - Agente de Impresion Cantina Reducto
# PowerShell puro - no requiere instalacion adicional
# Escucha en localhost:9100 y envia tickets directo a la impresora

$PORT = 9100
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$PORT/")
$listener.Start()

Write-Host ""
Write-Host "======================================="
Write-Host "  AGENTE DE IMPRESION - Cantina Reducto"
Write-Host "======================================="
Write-Host "  Puerto: localhost:$PORT"
Write-Host "  Estado: ACTIVO - No cierres esto"
Write-Host "======================================="
Write-Host ""

while ($listener.IsListening) {
    try {
        $context  = $listener.GetContext()
        $request  = $context.Request
        $response = $context.Response

        $response.Headers.Add("Access-Control-Allow-Origin",  "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

        $path   = $request.Url.LocalPath
        $method = $request.HttpMethod

        # OPTIONS (preflight CORS)
        if ($method -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        # GET /status
        if ($method -eq "GET" -and $path -eq "/status") {
            $body  = '{"ok":true,"message":"Agente de impresion activo"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
            $response.ContentType = "application/json"
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # POST /print
        if ($method -eq "POST" -and $path -eq "/print") {
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $json   = $reader.ReadToEnd()
            $reader.Close()

            try {
                $t = $json | ConvertFrom-Json

                $LINE = "--------------------------------"
                function CenterLine($str, $w = 32) {
                    $pad = [Math]::Max(0, [Math]::Floor(($w - $str.Length) / 2))
                    return (" " * $pad) + $str
                }
                function PadRow($label, $value, $w = 32) {
                    $space = $w - $label.Length - "$value".Length
                    return $label + (" " * [Math]::Max(1, $space)) + "$value"
                }

                $total = try { "Gs. $("{0:N0}" -f [int]$t.total)" } catch { "Gs. 0" }
                $nombre = if ($t.fullName) { $t.fullName.ToUpper() } else { "SOCIO" }
                $dishName = if ($t.dishName) { $t.dishName } else { "DESAYUNO" }
                $categ = if ($t.category) { $t.category.ToUpper() } else { "" }

                $lines = @(
                    (CenterLine "COMEDOR REDUCTO"),
                    (CenterLine "Cooperativa Reducto Ltda."),
                    (CenterLine "Casa Central"),
                    $LINE,
                    (CenterLine "Pedido Nro. #$($t.orderId)"),
                    $(if ($t.isReprint) { (CenterLine "[ REIMPRESION ]") } else { "" }),
                    $LINE,
                    "FECHA: $($t.timestamp)",
                    "CI:    $($t.userId)",
                    "NOMBRE: $nombre",
                    $LINE,
                    (PadRow "TIPO:" $categ),
                    (PadRow "PLATO:" $dishName),
                    (PadRow "CANT:" "$($t.quantity)"),
                    $LINE,
                    (CenterLine "TOTAL A PAGAR"),
                    (CenterLine $total),
                    "",
                    "",
                    "_".PadRight(32, "_"),
                    (CenterLine "Firma del beneficiario"),
                    "",
                    (CenterLine "¡Buen provecho!"),
                    "",
                    "Impreso: $(Get-Date -Format 'dd/MM/yyyy HH:mm')",
                    "`n`n`n`n"
                )
                $text = $lines -join "`n"

                # Detectar TM-U220
                $printerName = Get-Printer | Where-Object { $_.Name -like "*TM*U220*" -or $_.Name -like "*TM-U220*" } | Select-Object -First 1 -ExpandProperty Name
                if (-not $printerName) {
                    $printerName = (Get-Printer | Select-Object -First 1 -ExpandProperty Name)
                }

                $text | Out-Printer -Name $printerName
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Ticket #$($t.orderId) impreso en: $printerName"
                $responseBody = '{"success":true}'

            } catch {
                Write-Host "ERROR: $($_.Exception.Message)"
                $responseBody = "{`"error`":`"$($_.Exception.Message)`"}"
            }

            $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
            $response.ContentType = "application/json"
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        $response.StatusCode = 404
        $response.Close()

    } catch {
        Write-Host "Error en listener: $($_.Exception.Message)"
    }
}
