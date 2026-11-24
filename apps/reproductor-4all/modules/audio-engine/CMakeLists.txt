cmake_minimum_required(VERSION 3.22.1)
project(audioengine CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(oboe REQUIRED CONFIG)

add_library(audioengine SHARED
    android/src/main/cpp/AMediaDecoder.cpp
    android/src/main/cpp/ParametricEQ.cpp
    android/src/main/cpp/AudioEngine.cpp
    android/src/main/cpp/AudioEngineJNI.cpp
)

target_include_directories(audioengine PUBLIC
    android/src/main/cpp
)

target_link_libraries(audioengine
    oboe::oboe
    mediandk
    OpenSLES
    android
    log
)
