// New file: src/controller/matching.controller.js
import MatchingService from '../services/matchingService.js';
import TutorProfile from '../model/tutor.js';
import StudentProfile from '../model/students.js';

export async function getSmartRecommendations(req, res) {
  try {
    const userId = req.user.sub;
    const { maxResults = 10, subjects, schedule } = req.query;

    // Get student profile
    const studentProfile = await StudentProfile.findOne({ accountId: userId });
    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Get all available tutors
    const tutors = await TutorProfile.find({})
      .select('accountId fullName subjectSpecialty experienceYears ratingAvg totalRatings hourlyRate bio availability')
      .lean();

    // Prepare student preferences
    const preferences = {
      subjects: subjects ? subjects.split(',') : studentProfile.learningGoals,
      schedule: schedule || studentProfile.preferredSchedule
    };

    // Get smart matches
    const recommendations = await MatchingService.findBestMatches(
      studentProfile, 
      tutors, 
      preferences
    );

    // Return top matches
    const topMatches = recommendations.slice(0, maxResults);

    res.json({
      success: true,
      recommendations: topMatches,
      totalMatches: recommendations.length,
      matchCriteria: {
        subjects: preferences.subjects,
        schedule: preferences.schedule
      }
    });

  } catch (error) {
    console.error("Smart matching error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate recommendations",
      error: error.message 
    });
  }
}

export async function getMatchDetails(req, res) {
  try {
    const { tutorId } = req.params;
    const userId = req.user.sub;

    const studentProfile = await StudentProfile.findOne({ accountId: userId });
    const tutor = await TutorProfile.findById(tutorId);

    if (!studentProfile || !tutor) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const [matchResult] = await MatchingService.findBestMatches(studentProfile, [tutor]);

    res.json({
      success: true,
      matchDetails: {
        tutor: tutor,
        matchScore: matchResult.matchScore,
        matchPercentage: matchResult.matchPercentage,
        breakdown: {
          subjectCompatibility: MatchingService.calculateSubjectMatch(
            studentProfile.learningGoals, 
            tutor.subjectSpecialty
          ),
          scheduleCompatibility: MatchingService.calculateScheduleMatch(
            studentProfile.availability,
            tutor.availability
          ),
          ratingScore: MatchingService.calculateRatingScore(
            tutor.ratingAvg,
            tutor.totalRatings
          )
        }
      }
    });

  } catch (error) {
    console.error("Match details error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get match details" 
    });
  }
}