import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import FirebaseService from '@/services/FirebaseService'

const POSTS = 'posts'
const BOARDS = 'boards'
const IMGBANNER = 'imgbanner'

// const config = {
//   apiKey: "AIzaSyC8aq7GouxjIjJGA7WGccNNCn1HhL8uCys",
//   authDomain: "webmobile-sub2-730c1.firebaseapp.com",
//   databaseURL: "https://webmobile-sub2-730c1.firebaseio.com",
//   projectId: "webmobile-sub2-730c1",
//   storageBucket: "gs://webmobile-sub2-730c1.appspot.com",
//   messagingSenderId: "872601909524",
//   appId: "1:872601909524:web:c157dfaa2515b947"
// }

const config = {
  apiKey: "AIzaSyAZsR8WdjeUiFFwOLE2yVHosx9fxJfDwCc",
  authDomain: "naratmalssami-93474.firebaseapp.com",
  databaseURL: "https://naratmalssami-93474.firebaseio.com",
  projectId: "naratmalssami-93474",
  storageBucket: "naratmalssami-93474.appspot.com",
  messagingSenderId: "725896696284",
  appId: "1:725896696284:web:236449358c0edc3d"
};

firebase.initializeApp(config);
const firestore = firebase.firestore();
const messaging = firebase.messaging();

// 여기서 해도 바로 토큰 입력이 된다.

messaging
  .requestPermission()
  .then(function () {
    console.log("Notification permission granted.");
    return messaging.getToken()
  })
  .then(function (token) {
    console.log("token is : " + token);
  })
  .catch(function (err) {
    console.log("Unable to get permission to notify.", err);
  });


// foreground일 때도 알림이 뜨게 해주기 위해서
messaging.onMessage(function (payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    // icon: payload.notification.icon,
  };

  if (!("Notification" in window)) {
    console.log("This browser does not support system notifications");
  }
  else if (Notification.permission === "granted") {
    var notification = new Notification(notificationTitle, notificationOptions);

  }
});

export default {
  getBoards() {
    const postsCollection = firestore.collection(BOARDS)
    return postsCollection
      .orderBy('created_at', 'desc')
      .get()
      .then((docSnapshots) => {
        return docSnapshots.docs.map((doc) => {
          let data = doc.data()
          data.created_at = new Date(data.created_at.toDate())
          return data
        })
      })
  },
  async userTokenListFunc() {
    var userTokenList = [];
    await firestore.collection('userTokenList').get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        userTokenList.push(doc.data().token_id);
      });
    });
    return userTokenList;
  },
  postBoard(title, body, img) {
    let user = firebase.auth().currentUser;
    if (user !== null) {
      let userEmail = user.email;
      let userId = userEmail.split('@')[0];

      var userTokenList = FirebaseService.userTokenListFunc();
      userTokenList.then(function(result){
        result.forEach(function(element){
          FirebaseService.requestToFCM(element, userId);
        });
      });

      return firestore.collection(BOARDS).add({
        doc_id: firestore.collection(BOARDS).doc().id,
        boardViewCount: 0,
        title,
        body,
        img,
        author: userId,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      })
    } else {
      alert("로그인을 하지 않으셨습니다. 로그인해주세요.")
    }
  },
  updateBoardViewCount(doc_id) {
    firestore.collection(BOARDS).where('doc_id', '==', doc_id)
      .get()
      .then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
          firestore.collection(BOARDS).doc(doc.id).update({
            boardViewCount: firebase.firestore.FieldValue.increment(1)
          });
        });
      })
  },
  updateViewPageCount(pagename) {
    let user = firebase.auth().currentUser;
    if (user !== null) {
      let userEmail = user.email;
      let currentUserRef = firestore.collection('users').doc(userEmail);
      currentUserRef.update({
        [pagename]: firebase.firestore.FieldValue.increment(1)
      })
    }
  },
  getImgUrl(pagename) {
    const imgCollection = firestore.collection(IMGBANNER)
    return imgCollection.doc(pagename).get()
      .then(function (doc) {
        return doc.data()
      })
  },
  updateImgUrl(pagename, imgurl) {
    const imgCollection = firestore.collection(IMGBANNER)
    return imgCollection.doc(pagename).set({
        imgurl: imgurl
      })
      .then(function() {
        console.log("Document successfully written!");
      })
      .catch(function(error) {
        console.error("Error writing document: ", error);
      });
  },
  loginWithGoogle() {
    let provider = new firebase.auth.GoogleAuthProvider()
    return firebase.auth().signInWithPopup(provider).then(function(result) {
      let accessToken = result.credential.accessToken
      let user = result.user
      return result
    }).catch(function(error) {
      console.error('[Google Login Error]', error)
    })
  },
  requestToFCM(to, userId) {
    var request = require("request");

    request.post({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=AAAAqQLQkdw:APA91bHRMyXjEVtUOTgF-Xyha_JRXQq2TGIcQQzbALVPRRjxfVy7k4juxdWFAT2C3NufkD1wEj7uxgqgW3Fgt2SdrU132ORqg09L9JDZRaXA5d0zBYWbub7kphBxyc5WLo7cCmdZZUHy'
      },
      uri: "https://fcm.googleapis.com/fcm/send",
      body: JSON.stringify({
        "to": to,
        "notification": {
          "title": "아주 중요한 메세지입니다!!!",
          "body": userId + "님이 글을 쓰셨습니다"
        }
      })
    }, function (error, response, body) {
      console.log(body);
    });
  },
  notificationService() {
    messaging
      .requestPermission()
      .then(function() {
        console.log("Notification permission granted.");
        return messaging.getToken()
      })
      .then(function(token) {
        console.log("token is : " + token);
      })
      .catch(function(err) {
        console.log("Unable to get permission to notify.", err);
      });
  },
  getUserMessageList(){
		let userEmail = firebase.auth().currentUser.email;
		if(userEmail !== null){
			let currentUserRef = firestore.collection('users').doc(userEmail);
      return currentUserRef.get().then(function(doc){
        return doc.data().messageList;
      })
    }
  },
  setUserMessageList(messageList){
		let userEmail = firebase.auth().currentUser.email;
		if(userEmail !== null){
			let currentUserRef = firestore.collection('users').doc(userEmail);
      currentUserRef.update({
        messageList: messageList
      })
    }
  }

}
