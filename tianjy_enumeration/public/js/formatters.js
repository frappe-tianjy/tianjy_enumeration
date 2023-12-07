// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

// for license information please see license.txt

frappe.provide('frappe.form.formatters');

frappe.form.formatters.TianjyEnumeration = function (value, docfield, options, doc) {
	const doctype = 'Tianjy Enumeration Value';
	const link_title = frappe.utils.get_link_title(doctype, value);

	if (value && value.match && value.match(/^['"].*['"]$/)) {
		value.replace(/^.(.*).$/, '$1');
	}

	if (options && (options.for_print || options.only_value)) {
		return link_title || value;
	}

	if (frappe.form.link_formatters?.[doctype]) {
		// don't apply formatters in case of composite (parent field of same type)
		if (doc) {
			value = frappe.form.link_formatters[doctype](value, doc, docfield);
		}
	}

	if (!value) {
		return '';
	}
	if (value[0] == "'" && value[value.length - 1] == "'") {
		return value.substring(1, value.length - 1);
	}
	return value || link_title;
};
