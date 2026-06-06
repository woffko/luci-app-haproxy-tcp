# luci-app-haproxy-tcp

LuCI application for managing a small HAProxy-based TCP load balancer on
OpenWrt 25.12.x.

This package is intentionally narrow in scope. It manages one TCP frontend, one
statistics listener, and a list of upstream TCP servers. It does not try to be a
general-purpose HAProxy GUI.

## Features

- Modern LuCI JavaScript view and menu JSON.
- UCI-backed configuration in `/etc/config/haproxy-tcp`.
- Dedicated procd service named `haproxy-tcp`.
- Uses the standard `/usr/sbin/haproxy` binary.
- Validates generated HAProxy configuration with `haproxy -c` before starting.
- Does not disable or modify the stock `haproxy` init service.
- Runs HAProxy with an in-config `nobody:nogroup` privilege drop.
- Keeps the HAProxy stats listener disabled by default.
- English-only default UI strings.

## Dependencies

The package depends on the SSL-enabled `haproxy` package. It deliberately does
not depend on `haproxy-nossl`, so it can coexist with deployments that also need
TLS-capable HAProxy elsewhere on the router.

## Configuration

Default UCI file:

```text
/etc/config/haproxy-tcp
```

Example:

```uci
config haproxy-tcp
	option enable '1'
	option stats_enable '0'
	option stats '127.0.0.1:7777'
	option stats_auth ''
	option listen ':6666'
	option timeout '999'
	option retries '1'
	list upstreams '9.9.9.11:53'
	list upstreams '149.112.112.11:53 weight 100'
```

Supported endpoint syntax:

- `:6666`
- `*:6666`
- `192.168.10.1:6666`
- `example.net:6666`
- `[2001:db8::1]:6666`

Upstream entries may use optional HAProxy weight syntax:

```text
host:port weight 100
```

Optional stats authentication uses HAProxy `username:password` syntax:

```uci
option stats_auth 'admin:change-me'
```

## Service

```sh
/etc/init.d/haproxy-tcp enable
/etc/init.d/haproxy-tcp start
/etc/init.d/haproxy-tcp restart
```

The generated runtime configuration is written to:

```text
/var/etc/haproxy-tcp.cfg
```

## Build

Inside an OpenWrt 25.12.x SDK or buildroot:

```sh
git clone https://github.com/woffko/luci-app-haproxy-tcp.git package/luci-app-haproxy-tcp
make package/luci-app-haproxy-tcp/compile V=s
```

## Security Notes

The init script treats UCI as an administrative input and still validates values
before writing HAProxy configuration. Bind addresses and upstreams reject
control characters, quotes, backslashes, comments and semicolons to avoid
accidental directive injection in generated config files.

This package only exposes UCI access for `haproxy-tcp`; it does not need broad
service-control or service-list ubus permissions.

Stats are disabled by default and bind to `127.0.0.1` when enabled from
defaults. Set `stats_auth` before exposing the stats listener outside loopback.
