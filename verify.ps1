# Verification Test Script for NepaliTools
# Validates directory structure, compiled HTML outputs, SEO meta tags, and checks for dead links.

$pages = @(
    "index.html",
    "preeti-to-unicode/index.html",
    "unicode-to-preeti/index.html",
    "kantipur-to-unicode/index.html",
    "unicode-to-kantipur/index.html",
    "sagarmatha-to-unicode/index.html",
    "unicode-to-sagarmatha/index.html",
    "himali-to-unicode/index.html",
    "unicode-to-himali/index.html",
    "kanchan-to-unicode/index.html",
    "unicode-to-kanchan/index.html",
    "english-to-nepali-typing/index.html",
    "english-to-nepali-translator/index.html",
    "nepali-to-english-translator/index.html",
    "romanized-nepali-to-unicode/index.html",
    "nepali-typing/index.html",
    "nepali-typing-practice/index.html",
    "nepali-typing-speed-test/index.html",
    "preeti-typing-practice/index.html",
    "preeti-typing-speed-test/index.html",
    "lok-sewa-typing-practice/index.html",
    "lok-sewa-typing-test/index.html",
    "fonts/index.html",
    "preeti-font-download/index.html",
    "kantipur-font-download/index.html",
    "sagarmatha-font-download/index.html",
    "himali-font-download/index.html",
    "kanchan-font-download/index.html",
    "learning-center/index.html",
    "preeti-keyboard-guide/index.html",
    "unicode-keyboard-guide/index.html",
    "preeti-character-map/index.html",
    "unicode-character-map/index.html",
    "font-converter/index.html",
    "batch-converter/index.html",
    "character-map/index.html",
    "faq/index.html",
    "preeti-vs-unicode/index.html",
    "unicode-chart/index.html",
    "nepali-voice-typing/index.html",
    "nepali-docs/index.html"
)

$assets = @(
    "assets/css/main.css",
    "assets/js/converter.js",
    "assets/js/nepalify.js",
    "assets/js/main.js",
    "assets/js/typing-hub.js",
    "assets/js/translator.js",
    "manifest.json",
    "sw.js"
)

Write-Host "Starting structural validation tests..." -ForegroundColor Green
$failed = $false

# 1. Verify Pages Existence & Basic SEO tags
Write-Host "`n1. Verifying Compiled HTML Pages..." -ForegroundColor Cyan
foreach ($page in $pages) {
    if (Test-Path $page) {
        $html = Get-Content $page -Raw
        
        # Check Title
        $titleMatch = $html -match "<title>(.*?)</title>"
        $title = if ($titleMatch) { $Matches[1] } else { "None" }
        
        # Check Meta Description
        $descMatch = $html -match '<meta name="description" content="(.*?)">'
        $desc = if ($descMatch) { $Matches[1] } else { "None" }
        
        # Check Schema block
        $schemaMatch = $html -match '<script type="application/ld\+json">'
        
        Write-Host "[OK]  $page exists." -ForegroundColor Green
        Write-Host "      Title: $title" -ForegroundColor Gray
        Write-Host "      Meta Desc: $desc" -ForegroundColor Gray
        
        if ($title -eq "None" -or $desc -eq "None") {
            Write-Host "      [WARNING] Missing SEO tags!" -ForegroundColor Yellow
        }
        if (!$schemaMatch) {
            Write-Host "      [WARNING] Missing JSON-LD Schema!" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[FAIL] $page is MISSING!" -ForegroundColor Red
        $failed = $true
    }
}

# 2. Verify PWA and Static Assets
Write-Host "`n2. Verifying Core Static Assets & PWA Files..." -ForegroundColor Cyan
foreach ($asset in $assets) {
    if (Test-Path $asset) {
        Write-Host "[OK]  $asset exists." -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $asset is MISSING!" -ForegroundColor Red
        $failed = $true
    }
}

# 3. Check for Dead Internal Links
Write-Host "`n3. Checking for Broken Internal Links..." -ForegroundColor Cyan
foreach ($page in $pages) {
    if (Test-Path $page) {
        $html = Get-Content $page -Raw
        # Find all absolute internal links in format "/href/"
        $links = [regex]::Matches($html, 'href="(/[a-zA-Z0-9\-]+/)"')
        foreach ($link in $links) {
            $linkVal = $link.Groups[1].Value
            # e.g., "/preeti-to-unicode/" translates to path "preeti-to-unicode/index.html"
            $targetPath = $linkVal.Trim("/") + "/index.html"
            if ($linkVal -eq "/") {
                $targetPath = "index.html"
            }
            
            if (!(Test-Path $targetPath)) {
                Write-Host "      [FAIL] Broken Link in ${page}: '$linkVal' -> target path '$targetPath' not found!" -ForegroundColor Red
                $failed = $true
            }
        }
    }
}

Write-Host "`n-------------------------------------------"
if ($failed) {
    Write-Host "Validation FAILED. Please review the errors above." -ForegroundColor Red
    Exit 1
} else {
    Write-Host "Validation SUCCESSFUL! All pages, assets, PWA config, and internal links verified." -ForegroundColor Green
    Exit 0
}
