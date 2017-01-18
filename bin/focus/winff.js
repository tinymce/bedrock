// Sends F6 to the active window using WSC.
// This is the firefox key for "focus body of frame"
var shell = WScript.CreateObject('WScript.Shell');
shell.SendKeys("{F6}");