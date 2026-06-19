# Robust Native PowerShell Web Server for NepaliTools
# Runs a local HTTP listener on port 8000 with connection close handling and HEAD method support.

$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

# Stop existing listeners if script was run before in same session
if ($global:nepaliToolsListener) {
    try {
        $global:nepaliToolsListener.Stop()
        $global:nepaliToolsListener.Close()
    } catch {}
}
$global:nepaliToolsListener = $listener

try {
    $listener.Start()
    Write-Host "----------------------------------------------------" -ForegroundColor Green
    Write-Host "NepaliTools Server is running at http://localhost:$port/" -ForegroundColor Green
    Write-Host "Press Ctrl+C in this terminal window to stop the server." -ForegroundColor Yellow
    Write-Host "----------------------------------------------------" -ForegroundColor Green
    
    # Auto-open the website in the user's default browser
    Start-Process "http://localhost:$port/"
    
    while ($listener.IsListening) {
        $response = $null
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $url = $request.Url.LocalPath
            
            # Clean up URL routes
            $localPath = $url.TrimStart("/")
            if ($url -eq "/") {
                $localPath = "index.html"
            } elseif ([System.IO.Directory]::Exists($localPath)) {
                $localPath = Join-Path $localPath "index.html"
            }
            
            if (Test-Path $localPath) {
                $bytes = [System.IO.File]::ReadAllBytes($localPath)
                
                # Determine correct Content-Type headers
                $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
                $contentType = "text/html; charset=utf-8"
                switch ($ext) {
                    ".css" { $contentType = "text/css; charset=utf-8" }
                    ".js" { $contentType = "application/javascript; charset=utf-8" }
                    ".json" { $contentType = "application/json; charset=utf-8" }
                    ".png" { $contentType = "image/png" }
                    ".woff2" { $contentType = "font/woff2" }
                    ".txt" { $contentType = "text/plain; charset=utf-8" }
                }
                
                $response.ContentType = $contentType
                
                # HTTP protocol rule: HEAD requests must only return headers, not body
                if ($request.HttpMethod -eq "HEAD") {
                    $response.ContentLength64 = $bytes.Length
                } else {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $response.StatusCode = 404
                $err = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $url")
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($err, 0, $err.Length)
                }
            }
        } catch {
            Write-Host "Request handling error: $_" -ForegroundColor Red
        } finally {
            if ($response -ne $null) {
                try { $response.Close() } catch {}
            }
        }
    }
} catch {
    Write-Host "Server startup error: $_" -ForegroundColor Red
} finally {
    $listener.Close()
}
