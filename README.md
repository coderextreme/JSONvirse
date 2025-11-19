x3d-jsonvirse
==============
Note:  This package was originally named JSONverse, but was renamed due to trademark infringement (but I can't find trademarks in Egypt, and the repository is archived and the website is no longer up).

Multiuser server/client for X3D

First:

Download nodejs/npm.  On Linux they come in the nodejs package.

AFAIK, this does not work on Windows Subsystem for Linux WSLg or WSL2. Assistance Welcome

To run put the following in the bash prompt (or do the equivalent in zsh, command prompt or powershell)
```
git clone https://github.com/coderextreme/JSONvirse
cd JSONvirse
npm install
export X3DJSONPORT=8088  # or 80 or whatever you like, normally something > 1024.  80 works on Windows.  Probably not Linux or Mac.
npm run start
```
Click on a one of the localhost:8088 links

Type CTRL-C to exit in the terminal window you started npx in.
