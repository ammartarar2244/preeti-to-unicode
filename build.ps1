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
            $blogsRaw = Get-Content "src/data/blogs.json" -Raw
            $blogs = $blogsRaw | ConvertFrom-Json
            $blogMetaList = @()
            foreach ($b in $blogs) {
                $blogMetaList += @{
                    title = $b.title
                    slug = $b.slug
                    publishDate = $b.publishDate
                    excerpt = $b.excerpt
                    category = $b.category
                }
            }
            $blogMetaJson = ConvertTo-Json -InputObject $blogMetaList -Compress
            $pageContent = $pageContent.Replace("/* BLOG_POSTS_JSON */", $blogMetaJson)
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
    
    foreach ($b in $blogs) {
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
        
        $dateCheckScript = @'
<script>
    (function() {
        const publishDate = new Date("{{DATE}}T00:00:00+05:00");
        if (new Date() < publishDate) {
            document.documentElement.innerHTML = '<head><meta name="robots" content="noindex, nofollow"><title>Scheduled Post - NepaliTools</title><style>body { background: #0f0f11; color: #e4e4e7; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; } a { color: #b3002d; text-decoration: none; font-weight: bold; }</style></head><body><div><h1>🔒 This post is scheduled for release on ' + publishDate.toLocaleDateString() + '</h1><p><a href="/blog/">Back to Blog Home</a></p></div></body>';
        }
    })();
</script>
'@
        $dateCheckScript = $dateCheckScript.Replace("{{DATE}}", $postDate)
        
        $blogTitle = "$postTitle - Nepali Language & Typing Blog"
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
{{DATE_CHECK_SCRIPT}}
'@
        $blogSchema = $blogSchema.Replace("{{TITLE}}", $postTitle)
        $blogSchema = $blogSchema.Replace("{{DATE}}", $postDate)
        $blogSchema = $blogSchema.Replace("{{EXCERPT}}", $postExcerpt)
        $blogSchema = $blogSchema.Replace("{{DATE_CHECK_SCRIPT}}", $dateCheckScript)
        
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
    <loc>https://nepalilanguagetools.com/english-to-nepali-typing/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
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
    <loc>https://nepalilanguagetools.com/nepali-typing/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
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
    <loc>https://nepalilanguagetools.com/preeti-font-download/</loc>
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
    <loc>https://nepalilanguagetools.com/blog/</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
'@

if (Test-Path "src/data/blogs.json") {
    $blogsRaw = Get-Content "src/data/blogs.json" -Raw
    $blogs = $blogsRaw | ConvertFrom-Json
    $currentDate = Get-Date -Format "yyyy-MM-dd"
    foreach ($b in $blogs) {
        # Only include in sitemap if the publish date is today or in the past
        if ($b.publishDate -le $currentDate) {
            $sitemapXml += "`r`n  <url>`r`n"
            $sitemapXml += "    <loc>https://nepalilanguagetools.com/blog/$($b.slug)/</loc>`r`n"
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

[System.IO.File]::WriteAllText("sitemap.xml", $sitemapXml, [System.Text.Encoding]::UTF8)
Write-Host "Regenerated sitemap.xml with blog posts." -ForegroundColor Yellow

Write-Host "Build complete! All pages compiled." -ForegroundColor Green
