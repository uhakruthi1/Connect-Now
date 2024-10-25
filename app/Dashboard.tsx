import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/authContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import UserProfile from '@/components/UserProfile';
import { StackNavigationProp } from '@react-navigation/stack';

interface Friend {
  friendId: string;
  friendEmail: string;
  friendProfilePhoto: string;
}


type RootStackParamList = {
  PrivateChat: {
    recipientId: string;
    recipientName: string;
    recipientImage: string;
  };
};


type DashboardNavigationProp = StackNavigationProp<RootStackParamList, 'PrivateChat'>;

export default function Dashboard() {
  const { user } = useAuth();
  const navigation = useNavigation<DashboardNavigationProp>(); 
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

 
  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'friends'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const friendsList: Friend[] = [];
        for (const friendDoc of querySnapshot.docs) {
          const friendData = friendDoc.data();
          const friendId = friendData.friendId;
          const userProfileDoc = await getDoc(doc(db, 'users', friendId));
          if (userProfileDoc.exists()) {
            const userProfileData = userProfileDoc.data();
            friendsList.push({
              friendId,
              friendEmail: userProfileData.email,
              friendProfilePhoto: userProfileData.profileImage || 'https://via.placeholder.com/50',
            });
          }
        }

        setFriends(friendsList);
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFriends();
    }
  }, [user]);

 
  const handleFriendPress = (friendId: string, friendEmail: string, friendProfilePhoto: string) => {
    navigation.navigate('PrivateChat', { 
      recipientId: friendId, 
      recipientName: friendEmail,
      recipientImage: friendProfilePhoto 
    });
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity 
      onPress={() => handleFriendPress(item.friendId, item.friendEmail, item.friendProfilePhoto)} // Pass friendProfilePhoto here
      style={styles.friendContainer}
    >
      <Image source={{ uri: item.friendProfilePhoto }} style={styles.profilePhoto} />
      <Text style={styles.friendName}>{item.friendEmail}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView>
      <UserProfile />
      <View style={styles.container}>
        <Text style={styles.header}>My Friends</Text>
        {loading ? (
          <ActivityIndicator size="large" color="skyblue" />
        ) : (
          friends.length === 0 ? (
            <Text>No friends yet</Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.friendId}
              renderItem={renderFriendItem}
            />
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  friendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  friendName: {
    fontSize: 18,
  },
});
