import frappe
from frappe import _
from frappe.model.document import Document
@frappe.whitelist()
def options(type: str, parent: str = ''):
	values = frappe.get_all('Tianjy Enumeration Value', filters=dict(
		type=type,
		parent_value=parent if parent and isinstance(parent, str) else ('is', 'not set'),
	), fields=['name as value', 'label'])
	return values


def validate(self: Document, *args, **argv):
	fields = self.meta.get('fields', {'fieldtype': 'Tianjy Enumeration'})
	if not fields: return

	names = [self.get(field.fieldname) for field in fields]
	names = [value for value in names if value]

	values: dict[str, dict] = {}
	for value in frappe.get_all('Tianjy Enumeration Value', filters=dict(
		name=('in', names),
	), fields=['name', 'type', 'parent_value', 'label']):
		values[value.name] = value

	for field in fields:
		label = _(field.label or field.fieldname)
		name: str = self.get(field.fieldname)
		if not name: continue
		if name not in values:
			frappe.throw(f"{label}: 找不到枚举值 {name}")
		value = values[name]

		options = field.options
		if not isinstance(options, str): continue
		options = options.split(':', 2)
		type, parent_field = [options[0], ''] if len(options) == 1 else [options[0], options[1]]
		if value['type'] != type:
			frappe.throw(f"{label}: 枚举值 {_(value['label'])} 类型不匹配")
		parent_value = value['parent_value']
		if not parent_field:
			if parent_value:
				frappe.throw(f"{label}: 枚举值 {_(value['label'])} 不是基础值")
			continue
		parent: str | None = self.get(parent_field)
		if not parent:
			self.set(field.fieldname, None)
			continue
		if parent_value != parent:
			parent_item = values[parent] if parent in values else None
			if not parent_item: continue
			frappe.throw(f"{label}: 枚举值 {_(value['label'])} 不是 {_(parent_item['label'])} 的子项")

def validate_doctype(self: Document, *args, **argv):
	fields: dict[str, list[str]] = {}
	for field in self.get('fields', {'fieldtype': 'Tianjy Enumeration'}):
		options = field.options
		label = _(field.label or field.fieldname)
		if not isinstance(options, str) or not options:
			frappe.throw(f"请正确配置 {label} 字段的选项")
		options = options.split(':')
		if len(options) > 2:
			frappe.throw(f"请正确配置 {label} 字段的选项")
		fieldname = field.fieldname
		fields[fieldname] = ['' if len(options) == 1 else options[1], label]
	for field, data in fields.items():
		parent, label = data
		if not parent: continue
		if parent == field:
			frappe.throw(f"{label} 字段选项中所配置的父字段不能为自身");
		if parent not in fields:
			frappe.throw(f"{label} 字段选项中所配置的父字段不存在或不是 {_('Tianjy Enumeration')} 类型");
		labels = [label]
		while parent:
			data = fields[parent]
			parent, label = data
			labels.append(label)
			if not parent: continue
			if parent == field:
				frappe.throw(f"{'、'.join(labels)}字段的选项中所配置的父字段构成循环");
			if parent not in fields:
				frappe.throw(f"{label} 字段选项中所配置的父字段不存在或不是 {_('Tianjy Enumeration')} 类型");
