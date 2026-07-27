<!--
This file is part of Field Station AI.
README.md: Provides an overview of the project, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-20
Last Modified: 2026-07-27
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
Field Station AI™ is a private, in-browser AI workspace for health and behavioral researchers.

[![Field Station AI Preview](/images/FieldStationAI-preview.png)](https://code.depressioncenter.org/FieldStationAI/)

Field Station AI™ runs from a single web page, `index.html`, and never sends chats or data anywhere. Researchers can chat with a local assistant, ask questions about attachments, transcribe audio, classify text, summarize documents, and combine messy spreadsheets without sending study data to a cloud AI service by default. Models and optional knowledge base indexes download the first time they are selected, then run locally from the user's browser cache when available. Chats can be protected with a built-in emoji/numeric PIN pad.

Field Station AI™ is designed for workflows where data may be sensitive or contain PHI. However, depending on the user's institutional policies, cybersecurity and IRB review may still be required before use with regulated data.


## Quick Start Guide
**Want to try it first?** Check out the **[live demo](https://code.depressioncenter.org/FieldStationAI/)** — it ships with the U-M Health Research Resource Library knowledge base bundled in (works best with Llama or larger models).

Field Station AI™ is a single, dependency-free HTML file — there is no build step, so setup is just a matter of getting hosting that file with a web server and opening it in your browser. Note: you can't just double-click `index.html` to open it — browsers block AI model downloads for pages opened directly from disk, so it needs to be served over HTTP (localhost is fine). Follow these simple steps to run it:
1. Download or clone this repository.
2. Serve the folder over HTTP (web server):
 + To run locally, double-click the `run-*` script for your operating system, or serve the folder in python with `python -m http.server 8010`. The run scripts will automatically open your web browser, pointing it to: http://localhost:8010/
 + To run on a web server, create a directory in your web root called FieldStationAI, and copy the `index.html` file there. Then visit your website and add /FieldStationAI/ at the end of the URL.
3. Select a model from the dropdown and wait for it to download and compile. Once a model has been downloaded, you will not have to download it again, even if you close the application or refresh the page.
4. Type a prompt, attach a file, or open **Field Kit** (in the top right) for task-specific tools.
5. The knowledge-base (KB) badge next to the model dropdown has three states: **Off** (no knowledge base — answers come only from the model and any attachments), **UMich Health Research Resource Library** (answers take into account an index of our knowledge base, bundled in the included `efdc-kb.json` file), and **External** (answers prioritize an optional, custom knowledge base index loaded via the `?kb=` query parameter). Click the badge at any time to switch between whichever the different KB modes.

Optional: to point the app at your own knowledge base instead of (or in addition to) the bundled one, run `python build-kb-index.py <url>` to crawl a source site — it writes `index.json`. Pass it to the app via the `?kb=` query parameter, e.g. `/FieldStationAI/index.html?kb=index.json`; it shows up as "External" in the badge and, if it loads successfully, takes priority over the bundled KB and the models' own answers.
	 
### Documentation

Start here:

- [Quick Start](docs/quick-start.md)
- [User Guide](docs/user-guide.md)
- [Field Kit Guide](docs/field-kit.md)
- [Data, Files, Attachments, and Knowledge Bases](docs/data-files-and-knowledge-bases.md)
- [Security, Privacy, PHI, and Accessibility](docs/security-privacy-accessibility.md)

Deevloper docs:

- [Architecture Overview](docs/architecture.md)
- [Models and Runtime](docs/models-and-runtime.md)
- [Developer Guide](docs/developer-guide.md)
- [Design Change Record](docs/design-change-record.md)

Full EFDC documentation is available at: [EFDC Knowledge Base](https://michmed.org/efdc-kb)

### Detailed Setup & Usage

For local use:

```bash
git clone https://github.com/DepressionCenter/FieldStationAI.git
cd FieldStationAI
run-linux.sh # for Linux, or run-windows.ps1 for Windows, or run-mac.command for Mac
# or alternatively, run with: python -m http.server 8010
```
Then open the local server URL shown (the default is http://localhost:8010/).

For a custom knowledge base:

```bash
python build-kb-index.py --url "https://example.org/docs/" --out index.json --max-pages 10000 --delay 0.5
```

Then load:

```text
http://localhost:8010/index.html?kb=index.json
```

### Security, Privacy & Accessibility

Field Station AI™ is local-first. Data entered into the browser-based app is intended to stay on the user's computer unless the user deliberately points the app to an external or network-accessible destination.

Security expectations for contributors:

- Do not commit PHI, secrets, local data exports, model caches, generated indexes with sensitive content, or generated research outputs.
- Use synthetic examples in documentation and tests.
- Do not claim HIPAA compliance from code behavior alone.
- Review workflows with institutional privacy, IRB, and Information Assurance teams when required.
- If using AI coding agents, point them to [`AGENTS.md`](agents.md). Always verify the output and test it before sending a pull request.

Accessibility target for development:

- WCAG 2.1 AA or WCAG 2.2 AA.
- Keyboard-operable controls.
- Visible focus states.
- Labels for form fields.
- Status updates that do not rely on color alone.



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
