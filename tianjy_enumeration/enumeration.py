import frappe
from frappe.model.document import Document
@frappe.whitelist()
def options(type: str, parent: str = ''):
	values = frappe.get_all('Tianjy Enumeration Value', filters=dict(
		type=type,
		parent_value=parent if parent and isinstance(parent, str) else ('is', 'not set'),
	), fields=['name as value', 'label'])
	return values


def validate(self: Document, *args, **argv):
	...
	fields = self.meta.get('fields', {'fieldtype': 'Tianjy Enumeration'})
	if not fields: return

	names = [self.get(field.fieldname) for field in fields]
	names = [value for value in names if value]

	values = {}
	for value in frappe.get_all('Tianjy Enumeration Value', filters=dict(
		name=('in', names),
	), fields=['name', 'type', 'parent_value']):
		values[value.name] = value

	for field in fields:
		name = self.get(field.fieldname)
		if not name: continue
		if name not in values:
			... # TODO: 报错：找不到此项
		value = values.get(name)

		options = field.options
		if not isinstance(options, str): continue
		options = options.split(':', 2)
		type, parent_field = [options[0], ''] if len(options) == 1 else options
		if value.get('type') != type:
			... # TODO: 报错：类型不匹配
		parent_value = value.get('parent_value')
		if not parent_field:
			if parent_value:
				... # TODO: 报错: 所选值，不是基础值
			continue
		parent = self.get(parent_field)
		if not parent:
			... # TODO: 报错：父字段没有填值，此项不能填写
		if parent_value != parent:
			... # TODO: 报错：所选值与父字段值不一致

# TODO: 验证字段配置
