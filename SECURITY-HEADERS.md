# Security headers for thelostpages.net

GitHub Pages cannot set HTTP response headers. The pages already send the headers they can from inside the HTML:

- `Content-Security-Policy` via `<meta http-equiv="Content-Security-Policy">` on `/` and `/relics/`
- `Referrer-Policy` via `<meta name="referrer" content="strict-origin-when-cross-origin">`

These directives are **not** possible from a meta tag, and GitHub Pages will not send them. They need a proxy such as Cloudflare in front of the domain. This file only documents the values. It does not change DNS.

If Cloudflare (or another proxy) sends a Content-Security-Policy header **and** the page still has the meta tag, the browser enforces both. Keep the allow-lists identical so the header does not accidentally block a host the page is allowed to use.

## Home page (`/`)

The meta tag on the home page is:

```
default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; script-src 'self' 'sha256-5tkW6zTzkS2KBH+McD9u4/BoltWKxNUQMT+TCJt2cjY='; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https://img-cdn.magiceden.dev https://na-assets.pinit.io https://gateway.pinit.io; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; media-src 'self'; worker-src 'none'; manifest-src 'self'; upgrade-insecure-requests
```

The `sha256-` value is the hash of the small schema.org summary in the page. If that summary changes, the hash has to be recalculated or the browser will block it.

`frame-ancestors` cannot be set from the meta tag (browsers ignore it there). Put it on the HTTP header:

```
Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; frame-ancestors 'none'; script-src 'self' 'sha256-5tkW6zTzkS2KBH+McD9u4/BoltWKxNUQMT+TCJt2cjY='; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https://img-cdn.magiceden.dev https://na-assets.pinit.io https://gateway.pinit.io; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; media-src 'self'; worker-src 'none'; manifest-src 'self'; upgrade-insecure-requests
```

## Relics page (`/relics/`)

The relics viewer loads Three.js from cdnjs and the GLTF loader from jsDelivr, and some relic textures are embedded `data:` images. Its meta tag is:

```
default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' blob:; media-src 'self'; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests
```

HTTP header (adds `frame-ancestors`, which the meta tag cannot):

```
Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; frame-ancestors 'none'; script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' blob:; media-src 'self'; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests
```

Cloudflare can send a different Content-Security-Policy per path. Use the home value for `/` and the relics value for `/relics` and `/relics/*`. A single site-wide policy has to allow the union (both script hosts, `data:` and `blob:` images, and the home page's `sha256-` script hash).

## Headers the proxy should add on every response

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
```

`Strict-Transport-Security` tells browsers to use HTTPS for a year, including subdomains. Only turn this on after HTTPS is working for every name you use. The `preload` flag is optional and is hard to undo, so it is not included above.

`X-Frame-Options: DENY` and `frame-ancestors 'none'` both stop other sites from putting these pages in a frame. `X-Content-Type-Options: nosniff` stops browsers from guessing a file type. `Permissions-Policy` turns off camera, microphone, location, and payment APIs this site does not use.

## What each in-page rule is for

| Directive | Why it is there |
| --- | --- |
| `default-src 'self'` | Anything not listed has to come from thelostpages.net |
| `script-src` | Home page scripts are local, plus one hashed schema block. Relics also loads Three.js |
| `style-src` | Local CSS and Google Fonts stylesheets. No `'unsafe-inline'` |
| `font-src` | Font files from fonts.gstatic.com |
| `img-src` | Local art, the favicon, Magic Eden image CDN, and the Pinata hosts the pages actually request (`img-cdn.magiceden.dev`, `na-assets.pinit.io`, `gateway.pinit.io`) |
| `connect-src 'self'` | Relic model files (`.glb`) are loaded from this site |
| `object-src 'none'` | No plugins or Flash-style embeds |
| `base-uri 'self'` | Stops an injected `<base>` tag from redirecting links |
| `form-action 'self'` | Forms, if any are added, can only submit back to this site |
| `frame-src 'none'` | This site does not embed other pages |
| `upgrade-insecure-requests` | Rewrites accidental `http://` links to `https://` |
