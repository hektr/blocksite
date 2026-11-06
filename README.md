# Blocksite

<div align="center">

A simple, private, and fast website blocker for Google Chrome and Chromium-based browsers. 

Features an **anti-impulse confirmation mechanism** to prevent accidental unblocking, ensuring your focus remains intact.

<br>

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome)](https://developer.chrome.com/docs/extensions/develop)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](docs/LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-blue?logo=googlechrome)](https://chromewebstore.google.com/)
[![Privacy](https://img.shields.io/badge/Privacy-First-brightgreen)](docs/POLICY)

</div>

---

## Screenshots

<div align="center">
  <img src="icons/icon128.png" alt="Blocksite Icon" width="64"/>
  <br><br>
  <em>(Add your popup screenshot here, e.g., <img src="docs/popup-screenshot.png" alt="Blocksite Popup" width="320"/>)</em>
  <br>
  <em>Clean, modern interface with friction-based confirmation modals.</em>
</div>

---

## Features

- **Anti-Impulse Protection**: Removing a site or pausing the blocker requires a 5-second delay followed by typing a confirmation word. This prevents mindless, impulsive unblocking.
- **Stealth Blocking**: Powered by the native `declarativeNetRequest` API. Blocks are handled directly by the browser engine, meaning zero performance impact and no background script overhead.
- **Smart Pause**: Need a 15-minute break? Pause blocking with the same anti-impulse confirmation. The extension uses Chrome's Alarms API to reliably resume blocking even if the browser is closed and reopened.
- **Modern UI**: Clean, accessible interface with smooth animations, custom scrollbars, and a focus on usability.
- **100% Local & Private**: Your blocklist and settings are saved exclusively in `chrome.storage.local`. No data is ever sent to external servers.

---

## Privacy & Permissions

Blocksite is built with a "Privacy-First" philosophy. It requests only the absolute minimum permissions required to function:

- **`declarativeNetRequest`**: To apply user-defined blocking rules natively within the browser.
- **`storage`**: To save your blocklist and pause timers locally.
- **`alarms`**: To reliably resume blocking after a pause without draining battery.
- **`tabs`**: To instantly close already open tabs that match your blocklist when you add a site or resume blocking. **We do not read, track, or store your tab URLs or content.**
- **`<all_urls>`**: Required by the blocking API to evaluate rules on any visited page. **We do not read, log, or transmit your browsing history or URLs.**

Read the full, detailed policy here: [**docs/POLICY**](docs/POLICY)

---

## License

This project is open-source and licensed under the **MIT License** — see the [LICENSE](docs/LICENSE) file for details.

---

## Support the Project

If Blocksite helps you stay focused and productive, consider supporting its development! Your contribution helps keep the project free, open-source, and ad-free.

<div align="center">

[![Support on Boosty](https://img.shields.io/badge/Support%20on-Boosty-orange?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMC44NCA0LjYxYTUuNSA1LjUgMCAwIDAtNy43OCAwTDEyIDUuNjdsLTEuMDYtMS4wNmE1LjUgNS41IDAgMCAwLTcuNzggNy43OGwxLjA2IDEuMDZMMTIgMjEuMjNsNy43OC03Ljc4IDEuMDYtMS4wNmE1LjUgNS41IDAgMCAwIDAtNy43OHoiPjwvcGF0aD48L3N2Zz4=)](https://boosty.to/hektr992)

</div>
