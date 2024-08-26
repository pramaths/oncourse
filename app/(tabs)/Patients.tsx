import React, { useEffect, useState } from "react";
import { FlatList, Pressable, View, Platform, Image } from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AIChat } from "@/components/AIChat";
import Icon from "react-native-vector-icons/FontAwesome";
import userIcon from "../../assets/images/patient.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";


const API_URL = __DEV__
  ? Platform.OS === "android"
    ? "http://192.168.31.110:8000/api/patients"
    : "http://localhost:8000/api/patients"
  : "";

type Patient = {
  id: number;
  name: string;
  age: number;
  gender: string;
  history: string;
  symptoms: string;
  additionalInfo: string;
};

type ApiResponse = Patient[];

const PatientCard: React.FC<{ patient: Patient; onPress: () => void }> = ({
  patient,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    className="bg-gray-800 p-4 mb-3 rounded-lg shadow-md"
  >
    <View className="flex-row items-center mb-2 ">
      <Image
        source={userIcon}
        style={{ width: 24, height: 24, marginRight: 8 }}
      />
      <ThemedText type="defaultSemiBold" className="text-white text-lg ml-2">
        {patient.name}
      </ThemedText>
    </View>
    <View className="flex-row items-center mb-1">
      <Icon name="calendar" size={20} color="#ffffff" />
      <ThemedText type="default" className="text-gray-300 ml-2">
        Age: {patient.age}
      </ThemedText>
    </View>
    <View className="flex-row items-center mb-1">
      <Icon name="venus-mars" size={20} color="#ffffff" />
      <ThemedText type="default" className="text-gray-300 ml-2">
        Gender: {patient.gender}
      </ThemedText>
    </View>
    <View className="flex-row items-center mb-1">
      <Icon name="history" size={20} color="#ffffff" />
      <ThemedText type="default" className="text-gray-300 ml-2">
        History: {patient.history}
      </ThemedText>
    </View>
    <View className="flex-row items-center mb-1">
      <Icon name="stethoscope" size={20} color="#ffffff" />
      <ThemedText type="default" className="text-gray-300 ml-2">
        Symptoms: {patient.symptoms}
      </ThemedText>
    </View>
    <View className="flex-row items-center">
      <Icon name="info-circle" size={20} color="#ffffff" />
      <ThemedText type="default" className="text-gray-300 ml-2">
        Additional Info: {patient.additionalInfo}
      </ThemedText>
    </View>
  </Pressable>
);

export default function PatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null
  );
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(
    null
  );
  const [selectedPatientAge, setSelectedPatientAge] = useState<number | null>(
    null
  );
  const [useremail, setEmail] = useState<string>("");

  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    const checkCredentials = async () => {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if(userEmail){
        setEmail(userEmail);
      }
      const userPassword = await AsyncStorage.getItem("userPassword");
      if (!userEmail || !userPassword) {
        router.push("/");
      } else {
        fetchPatients();
      }
    };

    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching from:", API_URL);
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch patients");
        }
        const data: ApiResponse = await response.json();
        console.log("Fetched patients:", data);
        setPatients(data);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    checkCredentials();
  }, []);

  const handlePatientSelect = (
    patientId: number,
    patientName: string,
    patientAge: number
  ) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setSelectedPatientAge(patientAge);

    navigation.setOptions({
      tabBarStyle: { display: 'none' }
    });
  };

  const handleCloseChatWindow = () => {
    setSelectedPatientId(null);
    setSelectedPatientName(null);
    setSelectedPatientAge(null);

    navigation.setOptions({
      tabBarStyle: { display: 'flex' }
    });
  };


  if (isLoading) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText type="default">Loading patients...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText type="default">Error: {error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <View className="flex-1 p-4">
        <ThemedText type="subtitle" className="my-4 text-xl font-bold">
          Patients List
        </ThemedText>
        <FlatList
          data={patients}
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              onPress={() => handlePatientSelect(item.id, item.name, item.age)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>
      {selectedPatientId && (
        <View className="flex w-full h-full">
          <AIChat
            patientId={selectedPatientId}
            userEmail ={useremail}
            onClose={handleCloseChatWindow}
          />
        </View>
      )}
    </ThemedView>
  );
}
