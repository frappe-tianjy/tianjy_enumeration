// special features for link
// buttons
// autocomplete
// link validation
// custom queries
// add_fetches
import Awesomplete from 'awesomplete';

frappe.ui.form.recent_link_validations = {};

frappe.ui.form.ControlTianjyEnumeration = class ControlTianjyEnumeration extends frappe.ui.form.ControlData {
	static trigger_change_on_input_event = false;
	make_input() {
		$(`<div class="link-field ui-front" style="position: relative;">
			<input type="text" class="input-with-feedback form-control">
		</div>`).prependTo(this.input_area);
		this.$input_area = $(this.input_area);
		this.$input = this.$input_area.find('input');
		this.set_input_attributes();
		this.$input.on('focus', () => {
			setTimeout(() => {
				if (!this.$input.val()) {
					this.$input.val('').trigger('input');
				}
			}, 500);
		});
		this.$input.attr('data-target', this.df.options);
		this.input = this.$input.get(0);
		this.has_input = true;
		this.setup_awesomeplete();
		this.bind_change_event();
	}
	__doctype = 'Tianjy Enumeration Value';
	set_formatted_input(value) {
		super.set_formatted_input(value);
		if (!value) { return; }

		if (!this.title_value_map) {
			this.title_value_map = {};
		}
		this.set_link_title(value);
	}
	get_translated(value) {
		return __(value);
	}
	is_translatable() {
		return true;
	}
	is_title_link() {
		return true;
	}
	async set_link_title(value) {
		const doctype = this.__doctype;

		if (!doctype || !this.is_title_link()) {
			this.translate_and_set_input_value(value, value);
			return;
		}

		const link_title =
			frappe.utils.get_link_title(doctype, value) ||
			(await frappe.utils.fetch_link_title(doctype, value));

		this.translate_and_set_input_value(link_title, value);
	}
	translate_and_set_input_value(link_title, value) {
		let translated_link_text = this.get_translated(link_title);
		this.title_value_map[translated_link_text] = value;

		this.set_input_value(translated_link_text);
	}
	parse_validate_and_set_in_model(value, e, label) {
		if (this.parse) { value = this.parse(value, label); }
		if (label) {
			this.label = this.get_translated(label);
			frappe.utils.add_link_title(this.df.options, value, label);
		}

		return this.validate_and_set_in_model(value, e, true);
	}
	parse(value) {
		return strip_html(value);
	}
	get_input_value() {
		if (this.$input) {
			const input_value = this.$input.val();
			return this.title_value_map?.[input_value] || input_value;
		}
		return null;
	}
	get_label_value() {
		return this.$input ? this.$input.val() : '';
	}
	set_input_value(value) {
		this.$input && this.$input.val(value);
	}
	getPatentValue(field) {
		if (this.docname == null && cur_dialog) {
			return cur_dialog.get_value(field);
		} else if (cur_frm) {
			return frappe.model.get_value(this.df.parent, this.docname, field);
		}
		const selector = `input[data-fieldname="${field}"]`;
		let input = null;
		if (cur_list) {
			input = cur_list.filter_area.standard_filters_wrapper.find(selector);
		}
		if (cur_page) {
			input = $(cur_page.page).find(selector);
		}
		if (input) { return input.val(); }

	}
	updateOptions() {
		const {options} = this.df;
		if (!options || typeof options !== 'string') { return; }
		const [enumType, enumFiled] = options.split(/\s*:\s*/, 2);
		if (!enumType) { return; }
		let enumParent = '';
		if (enumFiled) {
			enumParent = this.getPatentValue(enumFiled);
			if (!enumParent) { return; }
		}
		if (!this.$input.cache[enumType]) {
			this.$input.cache[enumType] = Object.create(null);
		}
		if (this.$input.cache[enumType][enumParent]) {
			// immediately show from cache
			this.awesomplete.list = this.$input.cache[enumType][enumParent];
		}
		frappe.call({
			type: 'POST',
			method: 'tianjy_enumeration.enumeration.options',
			no_spinner: true,
			args: { parent: enumParent, type: enumType },
			callback: ({message = []}) =>{
				if (!window.Cypress && !this.$input.is(':focus')) { return; }
				this.$input.cache[enumType][enumParent] = message;
				this.awesomplete.list = this.$input.cache[enumType][enumParent];
			},
		});

	}
	setup_awesomeplete() {
		let me = this;

		this.$input.cache = {};

		this.awesomplete = new Awesomplete(me.input, {
			minChars: 0,
			maxItems: 99,
			autoFirst: true,
			list: [],
			replace: function (item) {
				// Override Awesomeplete replace function as it is used to set the input value
				// https://github.com/LeaVerou/awesomplete/issues/17104#issuecomment-359185403
				this.input.value = me.get_translated(item.label || item.value);
			},
			data: function (item) {
				return {
					label: me.get_translated(item.label || item.value),
					value: item.value,
				};
			},
			filter: function () {
				return true;
			},
			item: function (item) {
				let d = this.get_item(item.value);
				if (!d.label) {
					d.label = d.value;
				}

				let _label = me.get_translated(d.label);
				let html = d.html || `<strong>${_label}</strong>`;
				if (
					d.description &&
					// for title links, we want to inlude the value in the description
					// because it will not visible otherwise
					(me.is_title_link() || d.value !== d.description)
				) {
					html += `<br><span class="small">${__(d.description)}</span>`;
				}
				return $('<li></li>')
					.data('item.autocomplete', d)
					.prop('aria-selected', 'false')
					.html(`<a><p title="${frappe.utils.escape_html(_label)}">${html}</p></a>`)
					.get(0);
			},
			sort: function () {
				return 0;
			},
		});

		const query = frappe.utils.debounce(e=> { this.updateOptions(); }, 500);
		this.$input.on('input', query);
		this.$input.on('focus', query);
		this.$input.on('blur', function () {
			if (me.selected) {
				me.selected = false;
				return;
			}
			let value = me.get_input_value();
			let label = me.get_label_value();
			let last_value = me.last_value || '';
			let last_label = me.label || '';

			if (value !== last_value) {
				me.parse_validate_and_set_in_model(value, null, label);
			}
		});

		this.$input.on('awesomplete-open', () => {
			this.autocomplete_open = true;
		});

		this.$input.on('awesomplete-close', () => {
			this.autocomplete_open = false;
		});

		this.$input.on('awesomplete-select', function (e) {
			let o = e.originalEvent;
			let item = me.awesomplete.get_item(o.text.value);

			me.autocomplete_open = false;

			// prevent selection on tab
			let TABKEY = 9;
			if (e.keyCode === TABKEY) {
				e.preventDefault();
				me.awesomplete.close();
				return false;
			}

			if (item.action) {
				item.value = '';
				item.label = '';
				item.action.apply(me);
			}

			// if remember_last_selected is checked in the doctype against the field,
			// then add this value
			// to defaults so you do not need to set it again
			// unless it is changed.
			if (me.df.remember_last_selected_value) {
				frappe.boot.user.last_selected_values[me.df.options] = item.value;
			}

			me.parse_validate_and_set_in_model(item.value, null, item.label);
		});

		this.$input.on('awesomplete-selectcomplete', function (e) {
			let o = e.originalEvent;
			if (o.text.value.indexOf('__link_option') !== -1) {
				me.$input.val('');
			}
		});
	}


	validate(value) {
		return this.validate_link_and_fetch(this.df, this.docname, value);
	}
	validate_link_and_fetch(df, docname, value) {

		const {fetch_map} = this;

		const columns_to_fetch = Object.values(fetch_map);

		// if default and no fetch, no need to validate
		if (!columns_to_fetch.length && df.__default_value === value) {
			return value;
		}

		function update_dependant_fields(response) {
			let field_value = '';
			for (const [target_field, source_field] of Object.entries(fetch_map)) {
				if (value) { field_value = response[source_field]; }
				frappe.model.set_value(
					df.parent,
					docname,
					target_field,
					field_value,
					df.fieldtype,
				);
			}
		}

		// to avoid unnecessary request
		if (value) {
			return frappe
				.xcall('frappe.client.validate_link', {
					doctype: this.__doctype,
					docname: value,
					fields: columns_to_fetch,
				})
				.then(response => {
					if (!docname || !columns_to_fetch.length) { return response.name; }
					update_dependant_fields(response);
					return response.name;
				});
		}
		update_dependant_fields({});
		return value;

	}

	get fetch_map() {
		const fetch_map = {};
		if (!this.frm) { return fetch_map; }

		for (const key of ['*', this.df.parent]) {
			if (this.frm.fetch_dict[key] && this.frm.fetch_dict[key][this.df.fieldname]) {
				Object.assign(fetch_map, this.frm.fetch_dict[key][this.df.fieldname]);
			}
		}

		return fetch_map;
	}
};

if (Awesomplete) {
	Awesomplete.prototype.get_item = function (value) {
		return this._list.find(function (item) {
			return item.value === value;
		});
	};
}
