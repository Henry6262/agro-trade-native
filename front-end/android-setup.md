# Android Setup - Add to AndroidManifest.xml

Add this to your `android/app/src/main/AndroidManifest.xml` file:

## Inside the <application> tag, add:

```xml
<application
  android:name=".MainApplication"
  android:label="@string/app_name"
  android:icon="@mipmap/ic_launcher"
  android:roundIcon="@mipmap/ic_launcher_round"
  android:allowBackup="false"
  android:theme="@style/AppTheme">
  
  <!-- ADD THIS: Google Maps API Key -->
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="AIzaSyCyufA02eE2szI8_Q2DSxIa5AabNSik3MA"/>
    
  <!-- Your other application components -->
  
</application>
```

## Also add these permissions at the top of the manifest (before <application>):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

That's it for Android!