import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  Pressable,
  FlatList,
  Image,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import io from "socket.io-client";
import axios from "axios";
import { BASE_URL } from "@/constants/routes";
import Popover from "react-native-popover-view";

import userIcon from "../assets/images/patient.png";
import doctorIcon from "../assets/images/doctor.png";
import arrow from "../assets/images/arrow.png";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Message = {
  id: string;
  text: string;
  isUser: boolean;
};

type PatientDetails = {
  id: number;
  name: string;
  age: string;
};

export const AIChat: React.FC<{ patientId: number, userEmail: string, onClose: () => void }> = ({
  patientId,
  userEmail,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(
    null
  );
  const [patientNaturalLanguageDetails, setPatientNaturalLanguageDetails] =
    useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const socketRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      scrollToBottom
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      scrollToBottom
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchPatientDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/patient/${patientId}`);
      setPatientDetails(response.data);

      const nlResponse = await axios.get(
        `${BASE_URL}/api/patients/${patientId}`
      );
      setPatientNaturalLanguageDetails(nlResponse.data);

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching patient details:", error);
      setIsLoading(false);
    }
  }, [patientId]);


  useEffect(() => {
    fetchPatientDetails();

    socketRef.current = io(BASE_URL, {
      path: "/socket.io",
      query: {
        userEmail: userEmail,
        patientId: patientId
      },
      transports: ["websocket", "polling"],
    });
    

    socketRef.current.on("connection", () => {
      console.log("Connected to WebSocket", { patientId, userEmail });
    });

    socketRef.current.on("connect_error", (error: any) => {
      console.error("Connection error:", error);
    });

    socketRef.current.on("assistant_response", (response: string) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: response,
        isUser: false,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [fetchPatientDetails]);

  useEffect(() => {
    if (
      socketRef.current &&
      socketRef.current.connected &&
      patientNaturalLanguageDetails &&
      messages.length === 0
    ) {
      socketRef.current.emit(
        "start_conversation",{
        patientNaturalLanguageDetails, userEmail, patientId}
      );
    }
  }, [patientNaturalLanguageDetails]);

  const sendMessage = useCallback(() => {
    if (inputText.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText("");
    console.log('Emitting chat_message with:', { userEmail, patientId });

    if (socketRef.current) {
      socketRef.current.emit("chat_message", {
        message: inputText,
        userEmail: userEmail,
        patientId : patientId,
      });
    }
    
    setTimeout(scrollToBottom, 100);
  }, [inputText, patientId, userEmail]);

  console.log("Patient Details:", patientNaturalLanguageDetails);

  if (isLoading || !patientDetails) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >

      <View className="flex-1 bg-white">
        <View className="bg-blue-500 w-full p-4 flex-row items-end justify-between border-b-2 border-gray-200 h-28 relative">
          <Pressable onPress={onClose} className="absolute top-4 right-4 z-10">
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
          <View className="flex-row items-end">
            <Image
              source={userIcon}
              style={{ width: 40, height: 40 }}
              className="rounded-full mr-3"
            />
            <View className="mb-2">
              <Text className="text-white text-md ">
                MR. {patientDetails.name.toUpperCase()} ({patientDetails.age}{" "}
                Y/O)
              </Text>
            </View>
          </View>

          <View className="flex-row items-end">
            <View className="bg-blue-600 rounded-full px-3 flex-row items-center py-1">
              <Text className="text-white text-sm mr-2">
                {totalPoints} points
              </Text>
              <Popover
                from={
                  <TouchableOpacity>
                    <MaterialIcons name="info" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                }
              >
                <Text>This is the contents of the popover</Text>
              </Popover>
            </View>
          </View>
        </View>

        {patientNaturalLanguageDetails && (
          <View className="bg-gray-100 p-4 border-b border-gray-300 text-black">
            <ScrollView style={{ maxHeight: 100 }}>
              <Text className="text-sm text-gray-800 mb-2">
                {patientNaturalLanguageDetails}
              </Text>
            </ScrollView>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <View
              className={`flex-row p-3 mb-2 mx-2 ${
                item.isUser ? "justify-end" : "justify-start"
              }`}
            >
              <View
                className={`rounded-lg p-3 max-w-[80%] ${
                  item.isUser ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <View className="flex-row items-center mb-1">
                  <Image
                    source={item.isUser ? userIcon : doctorIcon}
                    style={{ width: 24, height: 24, marginRight: 8 }}
                    className="rounded-full"
                  />
                  <Text className="text-sm font-bold text-gray-600">
                    {item.isUser ? "YOU" : "SENIOR AI DOCTOR"}
                  </Text>
                  {!item.isUser && item.points && (
                    <View className="bg-blue-500 rounded-full px-2 py-1 ml-2">
                      <Text className="text-white text-xs">
                        {item.points} points
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-black">{item.text}</Text>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          className="flex-1 w-full"
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />

        <View className="flex-row mt-4 w-full px-2 mb-10 items-center ">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Enter your response"
            className="flex-1 border border-gray-300 rounded-lg p-2 bg-gray-50"
            onSubmitEditing={sendMessage}
          />
          <Pressable
            onPress={sendMessage}
            className="ml-2 bg-blue-500 rounded-full"
          >
            <Image
              source={arrow}
              style={{ width: 36, height: 36 }}
              className="tint-white"
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
