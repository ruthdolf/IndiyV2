import { 
  db, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  getDoc,
  serverTimestamp,
  db as firebaseDb
} from '../firebase';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: Record<string, {
    displayName: string;
    avatar: string;
  }>;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: any;
  };
  updatedAt: any;
}

export const sendMessage = async (conversationId: string, senderId: string, text: string) => {
  const messageData = {
    senderId,
    text,
    createdAt: serverTimestamp(),
  };

  // Add message to subcollection
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

  // Update conversation last message
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: messageData,
    updatedAt: serverTimestamp(),
  });
};

export const getOrCreateConversation = async (currentUser: any, otherUser: any) => {
  // Check for existing conversation between these two
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', currentUser.uid)
  );
  
  const querySnapshot = await getDocs(q);
  let conversationId = '';

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.participants.includes(otherUser.uid)) {
      conversationId = doc.id;
    }
  });

  if (conversationId) return conversationId;

  // Create new conversation
  const newConversation = {
    participants: [currentUser.uid, otherUser.uid],
    participantDetails: {
      [currentUser.uid]: {
        displayName: currentUser.displayName || 'Me',
        avatar: currentUser.avatar || currentUser.photoURL || '',
      },
      [otherUser.uid]: {
        displayName: otherUser.displayName || 'Seller',
        avatar: otherUser.avatar || otherUser.photoURL || '',
      }
    },
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(conversationsRef, newConversation);
  // Add ID to document
  await updateDoc(docRef, { id: docRef.id });
  
  return docRef.id;
};
