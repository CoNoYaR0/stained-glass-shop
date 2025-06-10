const { createClient } = require('@supabase/supabase-js');
// const fetch = require('node-fetch'); // Needed for actual AI API calls

// Mock AI Moderation Function (Replace with actual API call)
async function getAIModeration(commentText) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  let language = 'en'; // Default mock
  let isAppropriate = true;
  let slurDetected = false;
  let hateSpeechDetected = false;
  let toxicityScore = Math.random() * 0.2; // Low toxicity by default

  if (commentText.toLowerCase().includes('hate')) {
    isAppropriate = false;
    hateSpeechDetected = true;
    toxicityScore = Math.random() * 0.5 + 0.5; // Higher toxicity
  }
  if (commentText.toLowerCase().includes('badword')) {
    isAppropriate = false;
    slurDetected = true;
    toxicityScore = Math.random() * 0.4 + 0.4;
  }

  // Simulate language detection (very basic)
  if (/[àâçéèêëîïôûùüÿñæœ]/i.test(commentText)) language = 'fr';
  // Basic Arabic character check (does not confirm valid words)
  else if (/[؀-ۿ]/.test(commentText)) language = 'ar';


  return {
    language: language,
    isAppropriate: isAppropriate,
    slur_detected: slurDetected,
    hate_speech_detected: hateSpeechDetected,
    toxicity_score: toxicityScore,
    raw_response: { mockProviderData: "Mock AI analysis complete.", detectedLanguage: language }
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is not configured.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Server configuration error.' }) };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  let reviewData;
  try {
    reviewData = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Invalid JSON.' }) };
  }

  const { product_id, author_name, rating, comment_text } = reviewData;

  // Basic Validation
  if (!product_id || !comment_text) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing product_id or comment_text.' }) };
  }
  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Rating must be a number between 1 and 5.' }) };
  }
  if (comment_text.length < 10) { // Example of a "well-written" check (minimum length)
      return { statusCode: 400, body: JSON.stringify({ message: 'Comment must be at least 10 characters long.'}) };
  }


  try {
    const aiResult = await getAIModeration(comment_text);

    const reviewStatus = aiResult.isAppropriate ? 'approved' : 'rejected_ai';
    const aiFlagged = !aiResult.isAppropriate;

    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          product_id,
          author_name: author_name || 'Anonymous', // Default to Anonymous
          rating,
          comment_text,
          status: reviewStatus,
          language: aiResult.language,
          ai_moderation_details: aiResult.raw_response,
          ai_flagged: aiFlagged,
          // submitted_at is defaulted by DB
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return { statusCode: 500, body: JSON.stringify({ message: 'Error saving review.', error: error.message }) };
    }

    return { statusCode: 201, body: JSON.stringify({ message: 'Review submitted successfully!', review: data[0] }) };
  } catch (error) {
    console.error('Error processing review:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Error processing review.' }) };
  }
};
