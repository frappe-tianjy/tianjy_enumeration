import frappe
import frappe.model
import frappe.model.create_new
import frappe.model.meta
import frappe.core.report.permitted_documents_for_user.permitted_documents_for_user
import frappe.desk.form.load
from frappe.database.mariadb.database import MariaDBDatabase

import frappe.utils.formatters
import frappe

from frappe.utils import formatdate

# 增加自定义类型
fieldtypes = ("Tianjy Enumeration",)
frappe.model.create_new.data_fieldtypes += fieldtypes
frappe.model.meta.data_fieldtypes += fieldtypes
frappe.core.report.permitted_documents_for_user.permitted_documents_for_user.data_fieldtypes += fieldtypes
frappe.model.data_fieldtypes += fieldtypes




# 增加新类型映射的数据库类型
old_setup_type_map = MariaDBDatabase.setup_type_map
def setup_type_map(self):
	self.db_type = "mariadb"
	old_setup_type_map(self)
	self.type_map.update({
		"Tianjy Enumeration": ("varchar", self.VARCHAR_LEN),
	})
MariaDBDatabase.setup_type_map = setup_type_map
if hasattr(frappe.local, "db") and frappe.local.db.db_type == "mariadb":
	setup_type_map(frappe.local.db)



# 返回标签名
old_get_title_values_for_link_and_dynamic_link_fields = frappe.desk.form.load.get_title_values_for_link_and_dynamic_link_fields
def get_title_values_for_link_and_dynamic_link_fields(doc, link_fields=None):
	link_titles = old_get_title_values_for_link_and_dynamic_link_fields(doc, link_fields)
	if not link_fields:
		meta = frappe.get_meta(doc.doctype)
		link_fields = meta.get("fields", {"fieldtype": "Tianjy Enumeration"})

	meta = frappe.get_meta('Tianjy Enumeration Value')
	for field in link_fields:
		if not doc.get(field.fieldname):
			continue
		if field.fieldtype != "Tianjy Enumeration": continue

		link_title = frappe.db.get_value(
			'Tianjy Enumeration Value', doc.get(field.fieldname), 'label', cache=True
		)
		link_titles["Tianjy Enumeration Value::" + doc.get(field.fieldname)] = link_title

	return link_titles

frappe.desk.form.load.get_title_values_for_link_and_dynamic_link_fields = get_title_values_for_link_and_dynamic_link_fields
