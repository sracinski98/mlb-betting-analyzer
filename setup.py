from setuptools import setup, find_packages

setup(
    name='job-listing-analyzer',
    version='0.1.0',
    author='Your Name',
    author_email='your.email@example.com',
    description='A tool to analyze and rank job listings from freelancing platforms.',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    install_requires=[
        'streamlit',
        'haystack',
        # Add other dependencies as needed
    ],
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.6',
)