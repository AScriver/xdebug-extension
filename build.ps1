[CmdletBinding()]
Param(
    [string]$Version
)

# 1. Define variables
$SRC_DIR = ".\src"
$BUILD_DIR = ".\build"
$MANIFEST_FILE = Join-Path $SRC_DIR "manifest.json"
$manifestContent = Get-Content $MANIFEST_FILE | ConvertFrom-Json
$CURRENT_VERSION = $manifestContent.version
if (-not $Version) { $Version = $CURRENT_VERSION }

# 2. Update manifest if version provided
if ($Version -ne $CURRENT_VERSION) {
    $manifestContent.version = $Version
    ($manifestContent | ConvertTo-Json -Depth 8) | Out-File $MANIFEST_FILE -Encoding UTF8
    Write-Host "Updated manifest version to: $Version"
}

# 3. Create build directory
if (-not (Test-Path $BUILD_DIR)) {
    New-Item -ItemType Directory -Path $BUILD_DIR | Out-Null
}

Write-Host "Build directory confirmed: $BUILD_DIR"

# 4. Create temp directories
$TMP_DIR = Join-Path ([System.IO.Path]::GetTempPath()) ([System.IO.Path]::GetRandomFileName())
$TMP_ZIP_DIR = Join-Path $TMP_DIR "zip"
$TMP_XPI_DIR = Join-Path $TMP_DIR "xpi"
New-Item -ItemType Directory -Path $TMP_DIR, $TMP_ZIP_DIR, $TMP_XPI_DIR | Out-Null

Write-Host "Created temporary directories: $TMP_ZIP_DIR, $TMP_XPI_DIR"

try {
    # 5. Copy src files and LICENSE
    Copy-Item -Path (Join-Path $SRC_DIR "*") -Destination $TMP_ZIP_DIR -Recurse
    Copy-Item -Path (Join-Path $SRC_DIR "*") -Destination $TMP_XPI_DIR -Recurse
    Write-Host "Copied $SRC_DIR to [$TMP_ZIP_DIR, $TMP_XPI_DIR]"

    Get-ChildItem -Path "." -Include "LICENSE*" -Recurse | ForEach-Object {
        Copy-Item $_.FullName -Destination $TMP_ZIP_DIR
        Copy-Item $_.FullName -Destination $TMP_XPI_DIR
    }
    Write-Host "Copied LICENSE to [$TMP_ZIP_DIR, $TMP_XPI_DIR]"

    ##6. Update manifest for Firefox in xpi directory
    $xpiManifestFile = Join-Path $TMP_XPI_DIR "manifest.json"
    $xpiManifest = Get-Content $xpiManifestFile -Raw | ConvertFrom-Json

    # Convert to PSCustomObject for safe property additions
    $xpiManifest = [PSCustomObject]($xpiManifest | ConvertTo-Json -Depth 32 | ConvertFrom-Json)

    # Add browser_specific_settings via Add-Member if missing
    if (-not $xpiManifest.PSObject.Properties['browser_specific_settings']) {
        Add-Member -InputObject $xpiManifest -MemberType NoteProperty -Name "browser_specific_settings" -Value @{
            gecko = @{ id = "xdebug-helper@DEV" }
        } -Force
    }

    # Ensure 'background' property exists
    if (-not $xpiManifest.PSObject.Properties['background']) {
        Add-Member -InputObject $xpiManifest -MemberType NoteProperty -Name "background" -Value @{} -Force
    }

    # Remove background.service_worker if present
    if ($xpiManifest.background -and $xpiManifest.background.service_worker) {
        $xpiManifest.background.PSObject.Properties.Remove("service_worker")
    }

    # Add scripts array via Add-Member if missing
    if (-not $xpiManifest.background.PSObject.Properties['scripts']) {
        Add-Member -InputObject $xpiManifest.background -MemberType NoteProperty -Name "scripts" -Value @("service_worker.js") -Force
    } else {
        $xpiManifest.background.scripts = @("service_worker.js")
    }

    ($xpiManifest | ConvertTo-Json -Depth 8) | Out-File $xpiManifestFile -Encoding UTF8
    Write-Host "Updated Firefox background script in manifest"

    # 7. Create .zip
    $zipPath = Join-Path $BUILD_DIR ("xdebug-helper@$Version.zip")
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [IO.Compression.ZipFile]::CreateFromDirectory($TMP_ZIP_DIR, $zipPath)
    Write-Host "Created zip archive: $zipPath"

    # 7a. Create .xpi (just another zip)
    $xpiPath = Join-Path $BUILD_DIR ("xdebug-helper@$Version.xpi")
    if (Test-Path $xpiPath) { Remove-Item $xpiPath -Force }
    [IO.Compression.ZipFile]::CreateFromDirectory($TMP_XPI_DIR, $xpiPath)
    Write-Host "Created xpi archive: $xpiPath"

    Write-Host "Build $Version complete: [$xpiPath, $zipPath]"
}
finally {
    # 8. Clean up
    if (Test-Path $TMP_DIR) {
        Remove-Item $TMP_DIR -Recurse -Force
    }
}