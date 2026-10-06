
import {
  getApp,
  getApps,
  initializeApp
} from 'firebase/app';

import {
  getFirestore
} from 'firebase/firestore';

import {
  getAuth
} from 'firebase/auth';

import { environment } from '../environments/environment';


const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(
        environment.firebase
      );


export const auth =
  getAuth(firebaseApp);


export const db =
  getFirestore(firebaseApp);

