Add-Type -AssemblyName System.IO.Compression.FileSystem

$expectedName = '31546YounghoonGim.Unofficial'
$expectedPublisher = 'CN=B3D2417D-BB7D-4AA2-ACED-43B59B9475E0'
$expectedPublisherDisplayName = 'Piano8283 Studio'
$expectedApplicationId = 'PodbbangUnofficial'
$expectedArchitecture = 'x64'
$packageJsonPath = Join-Path $PSScriptRoot '..\package.json'
$packageConfig = Get-Content -LiteralPath $packageJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
$expectedDisplayName = $packageConfig.build.appx.displayName
$expectedMinimumWindowsVersion = $packageConfig.build.appx.minVersion
if ($packageConfig.version -notmatch '^\d+\.\d+\.\d+$') {
    throw "Expected a three-part application version in $packageJsonPath; found '$($packageConfig.version)'."
}
$expectedVersion = "$($packageConfig.version).0"
$packageFiles = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '..\dist') -Filter '*.appx' -File -ErrorAction SilentlyContinue
$matchingPackages = @()

foreach ($packageFile in $packageFiles) {
    $archive = [System.IO.Compression.ZipFile]::OpenRead($packageFile.FullName)
    try {
        $manifestEntry = $archive.GetEntry('AppxManifest.xml')
        if ($null -eq $manifestEntry) {
            continue
        }

        $reader = [System.IO.StreamReader]::new($manifestEntry.Open())
        try {
            [xml]$manifest = $reader.ReadToEnd()
        }
        finally {
            $reader.Dispose()
        }

        $identity = $manifest.Package.Identity
        if ($identity.Name -eq $expectedName -and
            $identity.Publisher -eq $expectedPublisher -and
            $identity.Version -eq $expectedVersion -and
            $identity.ProcessorArchitecture -eq $expectedArchitecture -and
            $manifest.Package.Properties.DisplayName -eq $expectedDisplayName -and
            $manifest.Package.Properties.PublisherDisplayName -eq $expectedPublisherDisplayName -and
            $manifest.Package.Applications.Application.Id -eq $expectedApplicationId -and
            $manifest.Package.Dependencies.TargetDeviceFamily.MinVersion -eq $expectedMinimumWindowsVersion) {
            $matchingPackages += $packageFile
        }
    }
    finally {
        $archive.Dispose()
    }
}

if ($matchingPackages.Count -ne 1) {
    throw "Expected exactly one AppX package with the existing Store identity, publisher, display names, application id, x64 architecture, Windows minimum version, and package version $expectedVersion; found $($matchingPackages.Count)."
}

Write-Output "Verified Store package: $($matchingPackages[0].FullName)"
