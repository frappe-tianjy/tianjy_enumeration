from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")


setup(
	name="tianjy_enumeration",
	version='0.0.1',
	description="天玑枚举",
	author="Tianjy",
	author_email="Tianjy",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
