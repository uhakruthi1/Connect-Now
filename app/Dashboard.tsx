import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, ScrollView, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/authContext';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import UserProfile from '@/components/UserProfile';
import { StackNavigationProp } from '@react-navigation/stack';

interface Friend {
  friendId: string;
  friendEmail: string;
  friendUsername: string;
  friendProfilePhoto: string;
  friendStatus: string;
}

interface Group {
  groupId: string;
  groupTitle: string;
  groupCreatorId: string;
}

type RootStackParamList = {
  PrivateChat: { recipientId: string; recipientName: string; recipientImage: string; };
  GroupChat: { groupId: string; groupTitle: string; };
};

type DashboardNavigationProp = StackNavigationProp<RootStackParamList, 'PrivateChat'>;

export default function Dashboard() {
  const { user } = useAuth();
  const navigation = useNavigation<DashboardNavigationProp>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);

  useEffect(() => {
    const fetchFriendsAndGroups = async () => {
      setLoading(true);
      try {
        // Fetch Friends
        const friendsQuery = query(collection(db, 'friends'), where('userId', '==', user.uid));
        const friendsSnapshot = await getDocs(friendsQuery);
        const friendsList: Friend[] = [];
        for (const friendDoc of friendsSnapshot.docs) {
          const friendData = friendDoc.data();
          const friendId = friendData.friendId;
          const userProfileDoc = await getDoc(doc(db, 'users', friendId));
          if (userProfileDoc.exists()) {
            const userProfileData = userProfileDoc.data();
            const friendEmail = userProfileData.email;
            const friendUsername = friendEmail.split('@')[0];
            const friendStatus = userProfileData.status;
            friendsList.push({
              friendId,
              friendEmail,
              friendUsername,
              friendProfilePhoto: userProfileData.profileImage || 'https://via.placeholder.com/50',
              friendStatus,
            });
          }
        }
        setFriends(friendsList);

        // Fetch Groups where the user is a member
        const memberGroupsQuery = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
        const memberGroupsSnapshot = await getDocs(memberGroupsQuery);
        const memberGroupsList: Group[] = [];
        memberGroupsSnapshot.forEach(groupDoc => {
          const groupData = groupDoc.data();
          memberGroupsList.push({
            groupId: groupDoc.id,
            groupTitle: groupData.title,
            groupCreatorId: groupData.creatorId,
          });
        });

        // Fetch Groups where the user is the creator
        const creatorGroupsQuery = query(collection(db, 'groups'), where('creatorId', '==', user.uid));
        const creatorGroupsSnapshot = await getDocs(creatorGroupsQuery);
        const creatorGroupsList: Group[] = [];
        creatorGroupsSnapshot.forEach(groupDoc => {
          const groupData = groupDoc.data();
          creatorGroupsList.push({
            groupId: groupDoc.id,
            groupTitle: groupData.title,
            groupCreatorId: groupData.creatorId,
          });
        });

        // Combine both lists and remove duplicates
        const allGroups = [...memberGroupsList, ...creatorGroupsList];
        const uniqueGroups = allGroups.filter((value, index, self) =>
          index === self.findIndex((t) => t.groupId === value.groupId)
        );
        setGroups(uniqueGroups);
      } catch (error) {
        console.error('Error fetching friends and groups:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFriendsAndGroups();
    }
  }, [user]);

  useEffect(() => {
    const filtered = friends.filter(friend =>
      friend.friendUsername.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredFriends(filtered);

    const filteredGroups = groups.filter(group =>
      group.groupTitle.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredGroups(filteredGroups);
  }, [searchText, friends, groups]);

  const handleFriendPress = (friendId: string, friendUsername: string, friendProfilePhoto: string) => {
    navigation.navigate('PrivateChat', { recipientId: friendId, recipientName: friendUsername, recipientImage: friendProfilePhoto });
  };

  const handleGroupPress = (groupId: string, groupTitle: string) => {
    console.log(groupTitle);
    navigation.navigate('GroupChat', { groupId, groupTitle });
  };

  const renderFriendItem = ({ item }) => {
    const backgroundColor = item.friendStatus === 'online' ? '#D3D3D3' : '#D3D3D3';
    return (
      <TouchableOpacity
        onPress={() => handleFriendPress(item.friendId, item.friendUsername, item.friendProfilePhoto)}
        style={[styles.friendContainer, { backgroundColor }]}
      >
        <Image source={{ uri: item.friendProfilePhoto }} style={styles.profilePhoto} />
        <Text style={styles.friendName}>{item.friendUsername || 'Unnamed Friend'}</Text>
      </TouchableOpacity>
    );
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      onPress={() => handleGroupPress(item.groupId, item.groupTitle)}
      style={styles.friendContainer}
    >
      <Text style={styles.friendName}>{item.groupTitle}</Text>
    </TouchableOpacity>
  );

  const handleCreateGroup = async () => {
    try {
      const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
      let currentUserUsername = 'Unnamed User';
      if (currentUserDoc.exists()) {
        const userData = currentUserDoc.data();
        currentUserUsername = userData.email.split('@')[0];
      }
      const selectedFriendNames = selectedFriends.map(friend => friend.friendUsername);
      const memberNames = [currentUserUsername, ...selectedFriendNames];
      const groupDocRef = await addDoc(collection(db, 'groups'), {
        title: groupTitle,
        creatorId: user.uid,
        members: selectedFriends.map(friend => friend.friendId),
        memberNames: memberNames,
        createdAt: new Date(),
      });
      console.log('Group created with ID:', groupDocRef.id);
      setShowModal(false);
      navigation.navigate('GroupChat', { groupId: groupDocRef.id, groupTitle: groupTitle });
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <ScrollView>
      <UserProfile />
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends and groups..."
          value={searchText}
          onChangeText={setSearchText}
        />
        
        <Text style={styles.header}>My Friends</Text>
        {loading ? (
          <ActivityIndicator size="large" color="skyblue" />
        ) : (
          filteredFriends.length === 0 ? (
            <Text>No friends found</Text>
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.friendId}
              renderItem={renderFriendItem}
            />
          )
        )}

        <Text style={styles.header}>My Groups</Text>
        {loading ? (
          <ActivityIndicator size="large" color="skyblue" />
        ) : (
          filteredGroups.length === 0 ? (
            <Text>No groups found</Text>
          ) : (
            <FlatList
              data={filteredGroups}
              keyExtractor={(item) => item.groupId}
              renderItem={renderGroupItem}
            />
          )
        )}

        {filteredFriends.length === 0 && filteredGroups.length === 0 && !loading && (
          <Text>No friends or groups found matching your search.</Text>
        )}
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Group</Text>
            <TextInput
              style={styles.groupTitleInput}
              placeholder="Enter group title"
              value={groupTitle}
              onChangeText={setGroupTitle}
            />
            <Text style={styles.modalTitle}>Search Friends</Text>
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.friendId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (!selectedFriends.includes(item)) {
                      setSelectedFriends([...selectedFriends, item]);
                    }
                  }}
                  style={styles.friendContainer}
                >
                  <Image source={{ uri: item.friendProfilePhoto }} style={styles.profilePhoto} />
                  <Text style={styles.friendName}>{item.friendUsername}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroup}>
              <Text style={styles.createGroupText}>Create Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  searchInput: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  friendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'skyblue',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 30,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  groupTitleInput: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  createGroupButton: {
    backgroundColor: 'skyblue',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  createGroupText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});