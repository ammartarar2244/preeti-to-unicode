# static HTML compiler for NepaliTools
# Combines templates and page-specific markup, generating clean directory structures.

# 1. Read layout templates
$headTemplate = [System.IO.File]::ReadAllText("templates/head.html", [System.Text.Encoding]::UTF8)
$headerTemplate = [System.IO.File]::ReadAllText("templates/header.html", [System.Text.Encoding]::UTF8)
$sidebarTemplate = [System.IO.File]::ReadAllText("templates/sidebar.html", [System.Text.Encoding]::UTF8)
$footerTemplate = [System.IO.File]::ReadAllText("templates/footer.html", [System.Text.Encoding]::UTF8)
$layoutTemplate = [System.IO.File]::ReadAllText("templates/page_layout.html", [System.Text.Encoding]::UTF8)

# 2. Get list of files in src/
$srcFiles = Get-ChildItem "src" -Filter "*.html"

Write-Host "Starting build process..." -ForegroundColor Green

foreach ($file in $srcFiles) {
    $filePath = $file.FullName
    $fileName = $file.Name
    $baseName = $file.BaseName
    
    Write-Host "Compiling $fileName..." -ForegroundColor Cyan
    
    $rawContent = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
    
    $title = "Nepali Tools"
    $metaDesc = "Online Nepali language converter and typing tools."
    $schemaTag = ""
    $pageContent = $rawContent
    
    # Parse metadata block if present
    if ($rawContent -match "(?s)^<!--\s*(.*?)\s*-->") {
        $metaBlock = $Matches[1]
        
        # Extract Title
        if ($metaBlock -match "TITLE:\s*(.*?)(?:\r?\n|$)") {
            $title = $Matches[1].Trim()
        }
        
        # Extract Meta Description
        if ($metaBlock -match "META_DESCRIPTION:\s*(.*?)(?:\r?\n|$)") {
            $metaDesc = $Matches[1].Trim()
        }
        
        # Extract JSON-LD Schema
        if ($metaBlock -match "SCHEMA:\s*(\{[\s\S]*?\})(?:\r?\n|$)") {
            $schemaJson = $Matches[1].Trim()
            $schemaTag = "<script type=""application/ld+json"">`r`n$schemaJson`r`n</script>"
        }
        
        # Strip comments block to get HTML body
        $pageContent = $rawContent -replace "(?s)^<!--.*?-->", ""
        $pageContent = $pageContent.Trim()
    }
    
    # Inject variables into Head template
    $pageHead = $headTemplate.Replace("{{TITLE}}", $title)
    $pageHead = $pageHead.Replace("{{META_DESCRIPTION}}", $metaDesc)
    $pageHead = $pageHead.Replace("{{SCHEMA}}", $schemaTag)
    
    # Assemble layout
    $finalHTML = $layoutTemplate.Replace("<!-- HEAD -->", $pageHead)
    $finalHTML = $finalHTML.Replace("<!-- HEADER -->", $headerTemplate)
    $finalHTML = $finalHTML.Replace("<!-- SIDEBAR -->", $sidebarTemplate)
    $finalHTML = $finalHTML.Replace("<!-- CONTENT -->", $pageContent)
    $finalHTML = $finalHTML.Replace("<!-- FOOTER -->", $footerTemplate)
    
    # Determine output location
    if ($baseName -eq "index") {
        # Root index file
        [System.IO.File]::WriteAllText("index.html", $finalHTML, [System.Text.Encoding]::UTF8)
        Write-Host "Saved root index.html" -ForegroundColor Yellow
    } else {
        # Create directory with name of page to facilitate clean URLs
        $outDir = $baseName
        if (!(Test-Path $outDir)) {
            New-Item -ItemType Directory -Path $outDir | Out-Null
        }
        $outPath = Join-Path $outDir "index.html"
        [System.IO.File]::WriteAllText($outPath, $finalHTML, [System.Text.Encoding]::UTF8)
        Write-Host "Saved clean page to $outDir/index.html" -ForegroundColor Yellow
    }
}

Write-Host "Build complete! All pages compiled." -ForegroundColor Green
