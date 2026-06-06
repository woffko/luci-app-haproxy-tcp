'use strict';
'require form';
'require uci';
'require view';

function portValid(port) {
	var number = Number(port);
	return /^\d+$/.test(port) && number >= 1 && number <= 65535;
}

function validateEndpoint(value, allowWeight) {
	var endpoint = value;
	var weight;
	var parts;
	var host;
	var port;
	var idx;

	if (!value)
		return _('Value is required.');

	if (/[\r\n\t'"\\#;]/.test(value))
		return _('Control characters, quotes, backslashes, comments and semicolons are not allowed.');

	if (allowWeight) {
		parts = value.trim().split(/\s+/);

		if (parts.length === 3 && parts[1] === 'weight') {
			endpoint = parts[0];
			weight = Number(parts[2]);

			if (!/^\d+$/.test(parts[2]) || weight < 1 || weight > 256)
				return _('Weight must be a number between 1 and 256.');
		}
		else if (parts.length !== 1) {
			return _('Use either host:port or host:port weight 1..256.');
		}

		if (endpoint.indexOf('*:') === 0)
			return _('Wildcard addresses are only valid for bind addresses, not upstream servers.');
	}
	else if (/\s/.test(value)) {
		return _('Whitespace is not allowed in bind addresses.');
	}

	if (endpoint.charAt(0) === ':') {
		port = endpoint.substring(1);
	}
	else if (endpoint.indexOf('*:') === 0) {
		port = endpoint.substring(2);
	}
	else if (endpoint.charAt(0) === '[') {
		idx = endpoint.indexOf(']:');

		if (idx < 2)
			return _('IPv6 addresses must use [address]:port syntax.');

		host = endpoint.substring(1, idx);
		port = endpoint.substring(idx + 2);

		if (!/^[0-9A-Fa-f:.]+$/.test(host))
			return _('IPv6 addresses may only contain hexadecimal digits, colons and dots.');
	}
	else {
		idx = endpoint.lastIndexOf(':');

		if (idx <= 0)
			return _('Use host:port, :port, *:port or [IPv6]:port syntax.');

		host = endpoint.substring(0, idx);
		port = endpoint.substring(idx + 1);

		if (!/^[A-Za-z0-9_.-]+$/.test(host))
			return _('Hostnames and IPv4 addresses may only contain letters, digits, dots, underscores and hyphens.');
	}

	if (!portValid(port))
		return _('Port must be between 1 and 65535.');

	return true;
}

function validateStatsAuth(value) {
	var parts;

	if (!value)
		return true;

	if (/[\r\n\t '"\\#;]/.test(value))
		return _('Whitespace, control characters, quotes, backslashes, comments and semicolons are not allowed.');

	parts = value.split(':');

	if (parts.length !== 2 || !parts[0] || !parts[1])
		return _('Use username:password syntax.');

	return true;
}

return view.extend({
	load: function() {
		return uci.load('haproxy-tcp');
	},

	render: function(data) {
		var m, s, o;

		m = new form.Map(
			'haproxy-tcp',
			_('HAProxy TCP'),
			_('Configure a dedicated HAProxy TCP frontend and upstream server pool.')
		);

		s = m.section(form.TypedSection, 'haproxy-tcp', _('General settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enable', _('Enable'));
		o.rmempty = false;

		o = s.option(form.Flag, 'stats_enable', _('Enable stats listener'));
		o.rmempty = false;

		o = s.option(form.Value, 'stats', _('Stats bind address'));
		o.default = '127.0.0.1:7777';
		o.placeholder = '127.0.0.1:7777';
		o.rmempty = false;
		o.depends('stats_enable', '1');
		o.validate = function(section_id, value) {
			return validateEndpoint(value, false);
		};
		o.description = _('TCP bind address for the HAProxy statistics page. Bind to a LAN address only when firewall policy restricts access.');

		o = s.option(form.Value, 'stats_auth', _('Stats authentication'));
		o.placeholder = 'admin:change-me';
		o.password = true;
		o.depends('stats_enable', '1');
		o.validate = function(section_id, value) {
			return validateStatsAuth(value);
		};
		o.description = _('Optional HAProxy stats credentials in username:password format. Leave empty only for loopback-only stats access.');

		o = s.option(form.Value, 'listen', _('Service bind address'));
		o.default = ':6666';
		o.placeholder = ':6666';
		o.rmempty = false;
		o.validate = function(section_id, value) {
			return validateEndpoint(value, false);
		};
		o.description = _('TCP address accepted by this load balancer, for example :6666 or 192.168.10.1:6666.');

		o = s.option(form.Value, 'timeout', _('Timeout'));
		o.default = '999';
		o.placeholder = '999';
		o.datatype = 'range(-1,86400000)';
		o.rmempty = false;
		o.description = _('Timeout in milliseconds. Use -1 to omit HAProxy timeout directives.');

		o = s.option(form.Value, 'retries', _('Retries'));
		o.default = '1';
		o.placeholder = '1';
		o.datatype = 'range(0,10)';
		o.rmempty = false;

		o = s.option(form.DynamicList, 'upstreams', _('Upstream servers'));
		o.placeholder = '8.8.8.8:53';
		o.rmempty = false;
		o.validate = function(section_id, value) {
			return validateEndpoint(value, true);
		};
		o.description = _('Use one host:port per entry. Optional weighted syntax: host:port weight 100.');

		return m.render();
	}
});
