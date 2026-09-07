const fs = require('fs');
const path = './ios/App/App/AppDelegate.swift';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  if (!content.includes('import FirebaseCore')) {
    content = content.replace('import UIKit', 'import UIKit\nimport FirebaseCore');
  }

  if (!content.includes('FirebaseApp.configure()')) {
    content = content.replace(
      /func application\(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: \[UIApplication\.LaunchOptionsKey: Any\]\?\) -> Bool \{/,
      'func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {\n        FirebaseApp.configure()'
    );
  }

  fs.writeFileSync(path, content);
  console.log('Successfully patched AppDelegate.swift');
} else {
  console.log('AppDelegate.swift not found. (Expected if not run inside the iOS folder context yet)');
}
