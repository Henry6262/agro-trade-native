# iOS Setup - Add to AppDelegate

## 1. Edit your `ios/YourAppName/AppDelegate.mm` (or AppDelegate.m) file:

At the top of the file, add this import:
```objc
#import <GoogleMaps/GoogleMaps.h>
```

Inside the `didFinishLaunchingWithOptions` method, add:
```objc
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // ADD THIS LINE with your API key
  [GMSServices provideAPIKey:@"AIzaSyCyufA02eE2szI8_Q2DSxIa5AabNSik3MA"];
  
  // ... rest of your existing code ...
  
  return YES;
}
```

## 2. Edit your `ios/YourAppName/Info.plist` file:

Add these location permission descriptions:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to your location to help you add warehouse and storage locations for your agricultural products.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs access to your location to show nearby bases and optimize delivery routes.</string>
```

## 3. Install iOS dependencies:

```bash
cd ios
pod install
cd ..
```

That's it for iOS!