from typing import Any
import frappe
from frappe.query_builder import DocType


def _field_where(dt: str, df: str = ''):
	Table = DocType('DocField')
	where = (Table.parent == dt)
	where = where & (Table.parenttype == 'DocType')
	where = where & (Table.parentfield == 'fields')
	if df:
		where = where & (Table.fieldname == df)

	return where



def update_field(dt: str, fieldname: str, values: dict[str, Any]):
	Table = DocType('DocField')
	q = frappe.qb.update(Table)
	for k, v in values.items():
		q = q.set(Table[k], v)
	q = q.where(_field_where(dt, fieldname))
	print(str(q))
	q.run()

def add_select_options(dt: str, df: str, new_options: list[str]):
	Table = DocType('DocField')

	values: list[str] = (frappe.qb.from_(Table)
		.select('options')
		.where(_field_where(dt, df))
		.limit(1)
	).run(pluck=True)
	if not values:
		return
	options: list[str] = [v for v in values[0].split('\n') if v]
	added = False
	for t in new_options:
		if t in options:
			continue
		options.append(t)
		added = True
	if not added:
		return
	update_field(dt, df, {'options': '\n'.join(options)})




def run():
    add_select_options('DocField', 'fieldtype', [
        'Tianjy Enumeration',
    ])
    add_select_options('Customize Form Field', 'fieldtype', [
        'Tianjy Enumeration',
    ])
    add_select_options('Custom Field', 'fieldtype', [
        'Tianjy Enumeration',
    ])
