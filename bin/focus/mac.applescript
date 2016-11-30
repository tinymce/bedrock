on run argv
  set appName to item 1 of argv

  if application appName is running then
      tell application id (id of application appName) to activate
      if appName is "firefox"
        tell application "System Events"
          -- 97 === F6 key, which is firefox for "focus body of frame"
          key code 97
        end tell
      end if
  end if
end run