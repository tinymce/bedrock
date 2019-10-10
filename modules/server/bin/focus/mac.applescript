on run argv
  set appName to item 1 of argv

  -- need this bit to prevent opening firefox if it's not already running
  if application appName is running then
      tell application id (id of application appName) to activate

      -- 97 is F6, which is the firefox key for "focus body of frame"
      -- this doesn't seem to work unless it's in the same AppleScript as the activate call,
      -- otherwise the f6 goes to the terminal
      if appName is "firefox"
        tell application "System Events"
          key code 97
        end tell
      end if
  end if
end run