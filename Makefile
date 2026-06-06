#
# Copyright (C) 2016-2026 honwen https://github.com/honwen
# Copyright (C) 2026 woffko
#
# This is free software, licensed under the MIT License.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-haproxy-tcp
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=woffko <https://github.com/woffko>

LUCI_TITLE:=LuCI support for HAProxy TCP load balancing
LUCI_DEPENDS:=+luci-base +haproxy
LUCI_PKGARCH:=all
LUCI_URL:=https://github.com/woffko/luci-app-haproxy-tcp
LUCI_MAINTAINER:=woffko <https://github.com/woffko>

define Package/$(PKG_NAME)/conffiles
/etc/config/haproxy-tcp
endef

include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/postinst
#!/bin/sh
if [ -z "$${IPKG_INSTROOT}" ] && [ -z "$${APK_INSTROOT}" ]; then
	if [ -f /etc/uci-defaults/luci-haproxy-tcp ]; then
		( . /etc/uci-defaults/luci-haproxy-tcp ) && \
		rm -f /etc/uci-defaults/luci-haproxy-tcp
	fi
	rm -f /tmp/luci-indexcache /tmp/luci-modulecache
fi
exit 0
endef

# call BuildPackage - OpenWrt buildroot signature
