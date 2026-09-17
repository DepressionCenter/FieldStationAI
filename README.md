<!--
This file is part of Field Station AI.
README.md: Provides an overview of the project, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-20
Last Modified: 2026-09-16
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
![Eisenberg Family Depression Center](https://code.depressioncenter.org/images/EFDCLogo_375w.png "depressioncenter.org")

# Field Station AI™

## Description
Field Station AI™ is an open-source, local-first AI workspace that runs in a web browser for health, behavioral, and digital-research workflows. It lets researchers use browser-based language and speech models without sending chats or study files to a cloud AI service by default.

[![Field Station AI Preview](/images/FieldStationAI-preview.png)](https://code.depressioncenter.org/FieldStationAI/)

From a single HTML page, users can chat with a local assistant, ask questions about attachments, transcribe audio, classify text, summarize documents, combine spreadsheets, and search an optional knowledge base. Models and indexes download on first use and can run from the browser cache afterward. A modern browser with WebGPU support and a high-end GPU (video card) are recommended for faster performance and larger models; smaller models may work on less powerful hardware.

Field Station AI™ is designed for workflows that may involve sensitive data or protected health information (PHI), but institutional cybersecurity and IRB review may still be required before it is used with regulated data.


## Quick Start Guide
**Want to try it first?** Check out the **[live demo](https://code.depressioncenter.org/FieldStationAI/)** — it ships with the U-M Health Research Resource Library knowledge base bundled in (works best with Llama or larger models).

Field Station AI™ is a single, dependency-free HTML file — there is no build step, so setup is just a matter of getting hosting that file with a web server and opening it in your browser. Note: you can't just double-click `index.html` to open it — browsers block AI model downloads for pages opened directly from disk, so it needs to be served over HTTP (localhost is fine). Follow these simple steps to run it:
1. Download or clone this repository.
2. Serve the folder over HTTP (web server):
 + To run locally, double-click the `run-*` script for your operating system, or serve the folder in python with `python -m http.server 8010`. The run scripts will automatically open your web browser, pointing it to: http://localhost:8010/
 + To run on a web server, create a directory in your web root called FieldStationAI, and copy the `index.html` file there. Then visit your website and add /FieldStationAI/ at the end of the URL.
3. Select a model from the dropdown and wait for it to download and compile. Once a model has been downloaded, you will not have to download it again, even if you close the application or refresh the page.
4. Type a prompt, attach a file, or open **Field Kit** (in the top right) for task-specific tools.
5. Click the knowledge-base badge next to the model dropdown to choose whether answers use the bundled U-M Health Research Resource Library index, your own index, or no knowledge base at all. See [Data, Files, Attachments, and Knowledge Bases](docs/data-files-and-knowledge-bases.md) for the details, and for how to build your own index with `build-kb-index.py`.


## Documentation
+ **Complete documentation:** See the [`/docs`](./docs/README.md) folder in this repository for the quick start, user guide, Field Kit guide, data and knowledge base reference, security and accessibility notes, and the developer and architecture guides.
+ **Overview for researchers and developers:** Visit the [Health Research Resource Library](https://michmed.org/efdc-kb) for a high-level summary, key features, and important assumptions.
+ **For AI coding agents:** Start with [AGENTS.md](AGENTS.md) and the skills listed in [SKILLS.md](SKILLS.md). Always review and test generated code before opening a pull request.



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
+ [ZippyServe](https://github.com/DepressionCenter/ZippyServe) - A zero-dependency local web server. It lets you test single-page apps quickly. It serves directories, zips, HTML, and Markdown. It provides the run-* scripts to allow starting Field Station AI locally without installing a full web server. DOI: [10.5281/zenodo.21613944](https://doi.org/10.5281/zenodo.21613944).

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
​​​​​​​     _DOI: [10.5281/zenodo.21617547](https://doi.org/10.5281/zenodo.21617547)_

----

Copyright © 2026 The Regents of the University of Michigan
