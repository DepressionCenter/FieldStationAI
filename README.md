<!--
This file is part of Field Station AI.
README.md: Provides an overview of the project, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-20
Last Modified: 2026-07-20
Summary: Field Station AI is a private, in-browser AI workspace for health and behavioral researchers. This file provides an overview of the project, in Markdown format.
Notes: See README file for documentation and full license information.

Copyright © 2026 The Regents of the University of Michigan

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License along
with this program. If not, see <https://www.gnu.org/licenses/>.

-->
![Eisenberg Family Depression Center](https://github.com/DepressionCenter/.github/blob/main/images/EFDCLogo_375w.png "depressioncenter.org")

# Field Station AI™

## Description
Field Station AI™ is a private, in-browser AI workspace for health and behavioral researchers.

[![Field Station AI Preview](/images/FieldStationAI-preview.png)](https://code.depressioncenter.org/FieldStationAI/)

Think of it as a single web page you open in your browser that gives you your own private AI assistant — one that never sends your data anywhere. You can chat with it, transcribe an interview recording, sort and label text responses, or clean up and merge messy spreadsheets, all without uploading anything to the internet. The first time you pick an AI model, your browser downloads it; after that, everything runs locally on your own computer, even without an internet connection. There's nothing to install, no account to create, and no company on the other end seeing your data — the only time the app reaches out to the internet is to download a model you've chosen, or to optionally load a knowledge-base file you've set up.

## Quick Start Guide
**Want to try it first?** Check out the **[general live demo](https://code.depressioncenter.org/FieldStationAI/)**, or the **[KB version](https://code.depressioncenter.org/FieldStationAI/?kb=efdc-kb.json)** that answers questions based on our knowledge base (works best with Llama or larger models).
+ Field Station AI is a single, dependency-free HTML file — there is no build step, so setup is just a matter of getting that file open in your browser. Download or clone this repository, then serve the folder with any static file host (e.g. `python -m http.server`) and navigate to it in a modern browser (Chrome, Edge, or Firefox recommended). Note: you can't just double-click `index.html` to open it — browsers block AI model downloads for pages opened directly from disk, so it needs to be served over HTTP (localhost is fine).
+ On first use, pick a language model from the menu; it will download once and run locally from then on (an internet connection is only needed for that initial download).
+ Optional: to serve a bundled knowledge base for the Skills' retrieval features, run `python build-kb-index.py` to crawl a source site and produce an `index.json` alongside `index.html`. Then pass it to the app via the `?kb=index.json` query parameter (e.g. `index.html?kb=index.json`).



## Documentation
+ The full documentation is available at: https://michmed.org/efdc-kb



## Additional Resources
+ [Mobile Technologies Core](https://depressioncenter.org/mobiletech) — the group that develops and maintains Field Station AI.
+ [EFDC Knowledge Base](https://michmed.org/efdc-kb) — documentation site referenced above and used as source content for the app's optional knowledge-base feature.



## About the Team
The [Mobile Technologies Core](https://depressioncenter.org/mobiletech) provides investigators across the University of Michigan the support and guidance needed to utilize mobile technologies and digital mental health measures in their studies. Experienced faculty and staff offer hands-on consultative services to researchers throughout the University – regardless of specialty or research focus.

Learn more at: [https://depressioncenter.org/mobiletech](https://depressioncenter.org/mobiletech).




## Contact
To get in touch, contact the individual developers in the check-in history.

If you need assistance identifying a contact person, email the EFDC's Mobile Technologies Core at: efdc-mobiletech@umich.edu.



## Credits
#### Contributors:
+ [Eisenberg Family Depression Center](https://depressioncenter.org) [(@DepressionCenter)](https://github.com/DepressionCenter)
+ [Gabriel Mongefranco](https://gabriel.mongefranco.com) [(@gabrielmongefranco)](https://github.com/gabrielmongefranco)



#### This work is based in part on the following projects, libraries and/or studies:

**Used by Field Station AI™:**
+ [Transformers.js](https://github.com/huggingface/transformers.js) - Runs Hugging Face transformer models (chat, vision, classification, and embedding) directly in the browser, entirely client-side.
+ [Pyodide](https://github.com/pyodide/pyodide) - A Python distribution compiled to WebAssembly, used to run pandas-based data-cleaning code locally in the browser sandbox.
+ [PapaParse](https://github.com/mholt/PapaParse) - In-browser CSV/delimited-text parsing used when ingesting research data files.
+ [SheetJS (xlsx)](https://github.com/SheetJS/sheetjs) - Reads and writes Excel spreadsheet files entirely client-side.
+ [PDF.js](https://github.com/mozilla/pdf.js) - Renders and extracts text from PDF documents in the browser.
+ [Ollama](https://github.com/ollama/ollama) - Optional, locally-run backend the app auto-detects to offer larger language models beyond what runs directly in-browser.

**Used by the knowledge-base crawler:**
+ [Requests](https://github.com/psf/requests) - A simple and elegant HTTP library for making web requests in Python.
+ [Beautiful Soup (bs4)](https://github.com/beautifulsoup/beautifulsoup) - A Python library for parsing HTML and XML documents.
+ [Sentence Transformers](https://github.com/UKPLab/sentence-transformers) - A Python framework for generating semantic embeddings and sentence-level vector representations.
+ [NumPy](https://github.com/numpy/numpy) - A foundational numerical computing library for Python, used for array and vector operations.
+ [typing_extensions](https://github.com/python/typing_extensions) - Backports and extensions for Python typing features to support compatibility across Python versions.



## License
### Copyright Notice
Copyright © 2026 The Regents of the University of Michigan


### Software and Library License Notice
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/gpl-3.0-standalone.html>.


### Documentation License Notice
Permission is granted to copy, distribute and/or modify this document 
under the terms of the GNU Free Documentation License, Version 1.3 
or any later version published by the Free Software Foundation; 
with no Invariant Sections, no Front-Cover Texts, and no Back-Cover Texts. 
You should have received a copy of the license included in the section entitled "GNU 
Free Documentation License". If not, see <https://www.gnu.org/licenses/fdl-1.3-standalone.html>



## Citation
If you find this repository, code or paper useful for your research, please cite it.

#### Citation Example:
>_Mongefranco, Gabriel (2026). Field Station AI™. University of Michigan. Software. https://github.com/DepressionCenter/FieldStationAI_  
​​​​​​​     _DOI: [Pending](https://doi.org/)_

----

Copyright © 2026 The Regents of the University of Michigan
