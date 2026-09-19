# static HTML compiler for NepaliTools
# Combines templates and page-specific markup, generating clean directory structures.

# 1. Read layout templates
$headTemplate = [System.IO.File]::ReadAllText("templates/head.html", [System.Text.Encoding]::UTF8)
$headerTemplate = [System.IO.File]::ReadAllText("templates/header.html", [System.Text.Encoding]::UTF8)
$sidebarTemplate = [System.IO.File]::ReadAllText("templates/sidebar.html", [System.Text.Encoding]::UTF8)
$footerTemplate = [System.IO.File]::ReadAllText("templates/footer.html", [System.Text.Encoding]::UTF8)
$layoutTemplate = [System.IO.File]::ReadAllText("templates/page_layout.html", [System.Text.Encoding]::UTF8)

# Read and minify main CSS for inlining
$cssContent = [System.IO.File]::ReadAllText("assets/css/main.css", [System.Text.Encoding]::UTF8)
$cssContent = $cssContent -replace '(?s)/\*.*?\*/', ''       # remove comments
$cssContent = $cssContent -replace '\s*([\{\};:,])\s*', '$1'  # remove whitespace around syntax chars
$cssContent = $cssContent -replace '\s+', ' '                 # collapse multiple spaces
$cssContent = $cssContent.Trim()

$headTemplate = $headTemplate.Replace("/* MAIN_CSS */", $cssContent)

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
    $canonicalUrl = ""
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

        # Extract Canonical Link
        if ($metaBlock -match "CANONICAL:\s*(.*?)(?:\r?\n|$)") {
            $canonicalUrl = $Matches[1].Trim()
        }
        
        # Extract JSON-LD Schema
        if ($metaBlock -match "SCHEMA:\s*([\[\{][\s\S]*[\]\}])(?:\r?\n|$)") {
            $schemaJson = $Matches[1].Trim()
            $schemaTag = "<script type=""application/ld+json"">`r`n$schemaJson`r`n</script>"
        }
        
        # Strip comments block to get HTML body
        $pageContent = $rawContent -replace "(?s)^<!--.*?-->", ""
        $pageContent = $pageContent.Trim()
    }
    
    if ($baseName -eq "blog") {
        if (Test-Path "src/data/blogs.json") {
            $blogsRaw = [System.IO.File]::ReadAllText("src/data/blogs.json", [System.Text.Encoding]::UTF8)
            $blogs = $blogsRaw | ConvertFrom-Json
            $blogMetaList = @()
            $blogCardsHtml = ""
            $currentDateStr = Get-Date -Format "yyyy-MM-dd"
            
            $sortedBlogs = $blogs | Sort-Object publishDate -Descending
            foreach ($b in $sortedBlogs) {
                if ($b.publishDate -gt $currentDateStr) { continue }
                $blogMetaList += @{
                    title = $b.title
                    slug = $b.slug
                    publishDate = $b.publishDate
                    excerpt = $b.excerpt
                    category = $b.category
                }
                
                $card = @"
        <article class="tool-card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
            <div>
                <span style="background-color: var(--primary-glow); color: var(--primary); padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-bottom: 12px;">
                    $($b.category)
                </span>
                <h3 class="tool-card-title" style="font-size: 1.25rem; font-weight: 700; line-height: 1.3; margin-bottom: 8px;">
                    <a href="/blog/$($b.slug)/" style="color: inherit; text-decoration: none; transition: var(--transition-fast);">
                        $($b.title)
                    </a>
                </h3>
                <p class="tool-card-desc" style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 16px;">
                    $($b.excerpt)
                </p>
            </div>
            <div style="border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted);">
                <span>📅 $($b.publishDate)</span>
                <a href="/blog/$($b.slug)/" style="color: var(--primary); text-decoration: none; font-weight: 600;">Read More →</a>
            </div>
        </article>
"@
                $blogCardsHtml += $card
            }
            $blogMetaJson = $blogMetaList | ConvertTo-Json -Compress
            $pageContent = $pageContent.Replace("/* BLOG_POSTS_JSON */", $blogMetaJson)
            $pageContent = $pageContent.Replace("<!-- JS will populate active posts here -->", $blogCardsHtml)
        }
    }

    # Determine Canonical link
    if ($canonicalUrl -eq "") {
        if ($baseName -eq "index") {
            $canonicalUrl = "https://nepalilanguagetools.com/"
        } else {
            $canonicalUrl = "https://nepalilanguagetools.com/$baseName/"
        }
    }
    
    # Inject variables into Head template
    $pageHead = $headTemplate.Replace("{{TITLE}}", $title)
    $pageHead = $pageHead.Replace("{{META_DESCRIPTION}}", $metaDesc)
    $pageHead = $pageHead.Replace("{{CANONICAL}}", $canonicalUrl)
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

# Compile individual blog posts
if (Test-Path "src/data/blogs.json") {
    Write-Host "Compiling individual blog posts..." -ForegroundColor Green
    $blogsRaw = Get-Content "src/data/blogs.json" -Raw
    $blogs = $blogsRaw | ConvertFrom-Json
    $blogPostTemplate = [System.IO.File]::ReadAllText("templates/blog_post.html", [System.Text.Encoding]::UTF8)
    
    # Ensure blog root directory exists
    if (!(Test-Path "blog")) {
        New-Item -ItemType Directory -Path "blog" | Out-Null
    }
    $currentDateStr = Get-Date -Format "yyyy-MM-dd"
    foreach ($b in $blogs) {
        if ($b.publishDate -gt $currentDateStr) { continue }
        $postSlug = $b.slug
        $postTitle = $b.title
        $postDate = $b.publishDate
        $postCategory = $b.category
        $postContent = $b.content
        $postExcerpt = $b.excerpt
        
        $postBody = $blogPostTemplate
        $postBody = $postBody.Replace("{{BLOG_TITLE}}", $postTitle)
        $postBody = $postBody.Replace("{{BLOG_CATEGORY}}", $postCategory)
        $postBody = $postBody.Replace("{{BLOG_DATE}}", $postDate)
        $postBody = $postBody.Replace("{{BLOG_CONTENT}}", $postContent)
        $blogTitle = $postTitle
        $blogMetaDesc = $postExcerpt
        
        $blogSchema = @'
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{{TITLE}}",
  "datePublished": "{{DATE}}",
  "description": "{{EXCERPT}}",
  "author": {
    "@type": "Organization",
    "name": "NepaliTools Editorial"
  },
  "publisher": {
    "@type": "Organization",
    "name": "NepaliTools"
  }
}
</script>
'@
        $blogSchema = $blogSchema.Replace("{{TITLE}}", $postTitle)
        $blogSchema = $blogSchema.Replace("{{DATE}}", $postDate)
        $blogSchema = $blogSchema.Replace("{{EXCERPT}}", $postExcerpt)
        
        $postCanonical = "https://nepalilanguagetools.com/blog/$postSlug/"
        
        $pageHead = $headTemplate.Replace("{{TITLE}}", $blogTitle)
        $pageHead = $pageHead.Replace("{{META_DESCRIPTION}}", $blogMetaDesc)
        $pageHead = $pageHead.Replace("{{CANONICAL}}", $postCanonical)
        $pageHead = $pageHead.Replace("{{SCHEMA}}", $blogSchema)
        
        $finalHTML = $layoutTemplate.Replace("<!-- HEAD -->", $pageHead)
        $finalHTML = $finalHTML.Replace("<!-- HEADER -->", $headerTemplate)
        $finalHTML = $finalHTML.Replace("<!-- SIDEBAR -->", $sidebarTemplate)
        $finalHTML = $finalHTML.Replace("<!-- CONTENT -->", $postBody)
        $finalHTML = $finalHTML.Replace("<!-- FOOTER -->", $footerTemplate)
        
        $postDir = Join-Path "blog" $postSlug
        if (!(Test-Path $postDir)) {
            New-Item -ItemType Directory -Path $postDir | Out-Null
        }
        $postOutPath = Join-Path $postDir "index.html"
        [System.IO.File]::WriteAllText($postOutPath, $finalHTML, [System.Text.Encoding]::UTF8)
        Write-Host "Compiled blog post: blog/$postSlug/index.html" -ForegroundColor Yellow
    }
}

# Rebuild sitemap.xml
$sitemapXml = @'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://nepalilanguagetools.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/preeti-to-unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/unicode-to-preeti/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/kantipur-to-unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/unicode-to-kantipur/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/sagarmatha-to-unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/unicode-to-sagarmatha/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/himali-to-unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/unicode-to-himali/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/kanchan-to-unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/unicode-to-kanchan/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/english-to-nepali-typing/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/english-to-nepali-translator/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/nepali-to-english-translator/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/romanized-nepali-to-unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/nepali-voice-typing/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/nepali-docs/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/nepali-typing-practice/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/nepali-typing-speed-test/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/preeti-typing-practice/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/preeti-typing-speed-test/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/lok-sewa-typing-practice/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/lok-sewa-typing-test/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/fonts/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/preeti-font-download/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/kantipur-font-download/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/sagarmatha-font-download/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/himali-font-download/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/kanchan-font-download/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/guides/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/typing/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/lok-sewa/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/translation/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/publishing/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/government-resources/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/kantipur-vs-unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/sagarmatha-vs-unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/himali-vs-unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/kanchan-vs-unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/preeti-keyboard-guide/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/unicode-keyboard-guide/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/preeti-character-map/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/unicode-character-map/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/font-converter/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/batch-converter/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/character-map/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/nepali-keyboard-layout/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/preeti-vs-unicode/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/unicode-chart/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/faq/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/about/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/blog/</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
'@

if (Test-Path "src/data/blogs.json") {
    $blogsRaw = Get-Content "src/data/blogs.json" -Raw
    $blogs = $blogsRaw | ConvertFrom-Json
    $currentDate = Get-Date -Format "yyyy-MM-dd"
    $currentDateStr = Get-Date -Format "yyyy-MM-dd"
    foreach ($b in $blogs) {
        if ($b.publishDate -gt $currentDateStr) { continue }
        # Only include in sitemap if the publish date is today or in the past
        if ($b.publishDate -le $currentDate) {
            $sitemapXml += "`r`n  <url>`r`n"
            $sitemapXml += "    <loc>https://nepalilanguagetools.com/blog/$($b.slug)/</loc>`r`n"
            $sitemapXml += "    <lastmod>$($b.publishDate)</lastmod>`r`n"
            $sitemapXml += "    <changefreq>monthly</changefreq>`r`n"
            $sitemapXml += "    <priority>0.6</priority>`r`n"
            $sitemapXml += "  </url>"
        }
    }
}

$sitemapXml += @'

  <url>
    <loc>https://nepalilanguagetools.com/privacy-policy/</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://nepalilanguagetools.com/terms/</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
'@

# Inject <lastmod> into every static <url> block
$sitemapXml = [regex]::Replace($sitemapXml, '(?ms)<url>\s*<loc>(https://nepalilanguagetools\.com/(?!blog/)[^<]*)</loc>', {
    param($match)
    return "<url>`r`n    <loc>$($match.Groups[1].Value)</loc>`r`n    <lastmod>$currentDate</lastmod>"
})

[System.IO.File]::WriteAllText("sitemap.xml", $sitemapXml, [System.Text.Encoding]::UTF8)
Write-Host "Regenerated sitemap.xml with <lastmod> timestamps and all blog posts." -ForegroundColor Yellow

try {
    Write-Host "Submitting sitemap to Google Search Console API..." -ForegroundColor Cyan
    $submitScript = "C:\Users\ammar\.gemini\antigravity\brain\50ac6b3e-158e-42dd-a233-0c27db079a0e\scratch\submit_sitemap.ps1"
    if (Test-Path $submitScript) {
        & powershell -ExecutionPolicy Bypass -File $submitScript
    }
} catch {
    Write-Host "Notice: Search Console submission warning: $_" -ForegroundColor Yellow
}

Write-Host "Build complete! All pages compiled." -ForegroundColor Green

