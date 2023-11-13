# Copyright (c) 2023, Tianjy and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils.nestedset import NestedSet

class TianjyEnumerationValue(NestedSet):
	def validate(self):
		if not self.is_new(): return
		if frappe.db.exists(self.doctype, dict(
			label=self.label,
			type=self.type,
			parent_value=self.parent_value,
		)):
			frappe.throw(_('Label, Type and Parent Value must be unique'))
