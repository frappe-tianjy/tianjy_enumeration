from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in tianjy_enumeration/__init__.py
from tianjy_enumeration import __version__ as version

setup(
	name="tianjy_enumeration",
	version=version,
	description="天玑枚举",
	author="Tianjy",
	author_email="Tianjy",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
