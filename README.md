x3d-jsonverse
==============

Multiuser server/client for X3D

First:

Download nodejs/npm.  On Windows they come in the nodejs package.

AFAIK, this does not work on Windows Subsystem for Linux WSLg or WSL2. Assistance Welcome

To run put the following in the bash prompt (or do the equivalent in zsh, command prompt or powershell)
```
git clone https://github.com/coderextreme/JSONverse # or download a zip; unzip into JSONverse folder
cd JSONverse
npm install
export X3DJSONPORT=8088  # or 80 or whatever you like, normally something > 1024.  80 works on Windows.  Probably not Linux or Mac.
npm run start
```
Or equivalent, without installing in a folder, (installs in your npm cache):
```
export X3DJSONPORT=8088  # or 80 or whatever you like, normally something > 1024.  80 works on Windows.  Probably not Linux or Mac.  Also using port 443 is not advised
npx x3d-jsonverse@latest
```
go to http://localhost:8088   # or whatever replaced 8088 above.
Type CTRL-C to exit in the terminal window you started npx in.
