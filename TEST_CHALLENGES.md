# 🧪 Testing Challenges & Rankings

## Quick Start - Add Test Data

To test the new challenges and rankings features, follow these steps:

### Step 1: Visit the Temp Data Page
Go to: **http://localhost:9002/add-temp-data**

### Step 2: Click "Add Temporary Data"
- This will add 3 sample challenges
- This will add 6 sample student results with rankings

### Step 3: View the Rankings
1. Go back to the home page: **http://localnpm run devhost:9002**
2. Look at the **left side** of the screen
3. You'll see a **Trophy icon button** (🏆) that opens the rankings slider
4. Click it to see the top students' rankings!

---

## 📊 What Gets Added

### Challenges:
1. **Array Sum Challenge** (Easy) - 50 points
2. **String Reversal** (Easy) - 40 points
3. **Binary Search** (Medium) - 100 points

### Sample Students:
- Rajesh Kumar (90 total points)
- Priya Singh (50 points)
- Arjun Patel (100 points)
- Neha Gupta (40 points)
- Vikram Sharma (75 points)

---

## 🎯 Test Features

After adding data, you can:

✅ **View Rankings Slider** on home page (left side, expandable)
✅ **Go to Challenges Page** - `/challenges`
✅ **Solve Challenges** and earn points
✅ **Check Rankings Page** - `/rankings`
✅ **Admin Panel** can create new challenges
✅ **Track Progress** with personal statistics

---

## 🔑 Key URLs

| Page | URL |
|------|-----|
| Home (with rankings slider) | http://localhost:9002 |
| Add Temp Data | http://localhost:9002/add-temp-data |
| Challenges | http://localhost:9002/challenges |
| Rankings | http://localhost:9002/rankings |
| Admin Panel | http://localhost:9002/admin |

---

## ⚙️ Technical Details

- **Challenges Collection**: `challenges/{challengeId}`
- **Results Collection**: `challengeResults/{resultId}`
- **Firestore Rules**: Temporarily set to allow reads/writes for testing
- **Test Data**: Includes 3 challenges and 6 sample results

---

## 🔒 Security Rules - After Testing

**IMPORTANT**: After testing, remember to restore restrictive Firestore rules:

```yaml
match /challenges/{challengeId} {
  allow read: if true;
  allow write: if isAdmin();
}

match /challengeResults/{resultId} {
  allow read: if true;
  allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
  allow write: if isAdmin();
}
```

This ensures only admins can create challenges once testing is complete.

---

## 🎨 Ranking Slider Features

The rankings slider on the home page includes:

- 📍 **Left side floating panel** with challenge rankings
- 🏆 **Top challengers** listed with medals (🥇🥈🥉)
- ➡️ **Navigation buttons** to flip through pages
- 🔗 **View All Rankings** link to full rankings page
- 🎯 **Toggle button** to open/close the slider

---

## 💡 Tips

1. **To clear data**: Go to Firebase Console → Firestore → Delete collections manually
2. **To add more data**: Edit `/add-temp-data` page with additional challenges/results
3. **To test solving**: Login to portal, go to `/challenges`, and solve a challenge
4. **Check admin panel**: `/admin` → Challenges tab to create new challenges (need admin rights)

---

**Enjoy testing! 🚀**
