#!/bin/bash

# Quick test script for MovieSayWhat API

echo "🚀 MovieSayWhat Quick Test"
echo "=========================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Server is not running!"
    echo "Please start the server first: npm start"
    exit 1
fi

echo "✓ Server is running"
echo ""

# Test 1: Register a user
echo "📝 Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test$(date +%s)@example.com\",\"password\":\"test123\"}")

TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Registration failed"
    echo $REGISTER_RESPONSE
    exit 1
fi

echo "✓ User registered successfully"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test 2: Get user profile
echo "👤 Testing user profile..."
PROFILE_RESPONSE=$(curl -s http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $TOKEN")

echo $PROFILE_RESPONSE | grep -q "email"
if [ $? -eq 0 ]; then
    echo "✓ Profile retrieved successfully"
    echo $PROFILE_RESPONSE | python3 -m json.tool 2>/dev/null || echo $PROFILE_RESPONSE
else
    echo "❌ Profile retrieval failed"
fi
echo ""

# Test 3: Get pricing plans
echo "💰 Testing pricing plans..."
PLANS_RESPONSE=$(curl -s http://localhost:3000/api/payment/plans)

echo $PLANS_RESPONSE | grep -q "basic"
if [ $? -eq 0 ]; then
    echo "✓ Pricing plans retrieved successfully"
    echo $PLANS_RESPONSE | python3 -m json.tool 2>/dev/null || echo $PLANS_RESPONSE
else
    echo "❌ Pricing plans retrieval failed"
fi
echo ""

# Test 4: Perform a search
echo "🔍 Testing search functionality..."
SEARCH_RESPONSE=$(curl -s "http://localhost:3000/api/search?query=hello" \
  -H "Authorization: Bearer $TOKEN")

echo $SEARCH_RESPONSE | grep -q "searchesUsed"
if [ $? -eq 0 ]; then
    echo "✓ Search completed successfully"
    echo $SEARCH_RESPONSE | python3 -m json.tool 2>/dev/null || echo $SEARCH_RESPONSE
else
    echo "❌ Search failed"
fi
echo ""

# Test 5: Test search without auth
echo "🔒 Testing authentication requirement..."
UNAUTH_RESPONSE=$(curl -s "http://localhost:3000/api/search?query=test")

echo $UNAUTH_RESPONSE | grep -q "requiresAuth"
if [ $? -eq 0 ]; then
    echo "✓ Authentication correctly required"
else
    echo "❌ Authentication not enforced"
fi
echo ""

echo "=========================="
echo "✅ Quick tests completed!"
echo ""
echo "For comprehensive testing, run: node test-api.js"
