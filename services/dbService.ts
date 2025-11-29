import { Quiz, TeachingGuide, User, QuestionType, QuizInvite, Submission, Question } from "../types";
import { supabase, isSupabaseConfigured } from './supabase';

const LOCAL_STORAGE_KEYS = {
  QUIZZES: 'qura_quizzes',
  GUIDES: 'qura_guides',
  USER: 'qura_user'
};

const DEFAULT_SETTINGS = {
  time_limit_minutes: 10,
  passing_score: 60,
  max_attempts: 3,
  shuffle_questions: true,
  show_results_immediately: true,
  grading_mode: 'AUTO'
};

// Polyfill for UUID generation to ensure it works in all browser contexts
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const dbService = {
  // --- DEV TOOLS ---
  clearAllData: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.QUIZZES);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.GUIDES);
    window.location.reload();
  },

  // --- STORAGE ---
  uploadQuizResource: async (quizId: string, file: File): Promise<string | null> => {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      console.log(`Uploading ${file.name} (${Math.round(file.size / 1024)}KB) to Supabase...`);

      // SANITIZE FILENAME: Remove non-alphanumeric chars to prevent Supabase errors
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${quizId}/${Date.now()}_${sanitizedName}`;

      // Add timeout to prevent hanging
      const uploadPromise = supabase.storage
        .from('Resources')
        .upload(filePath, file);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
      );

      const { error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

      if (error) {
        console.error("Storage upload error:", error);
        throw error;
      }

      const { data } = supabase.storage.from('Resources').getPublicUrl(filePath);
      console.log(`✓ Upload successful: ${data.publicUrl}`);
      return data.publicUrl;
    } catch (e: any) {
      console.error("Upload failed:", e.message || e);
      throw new Error(`Failed to upload ${file.name}: ${e.message || 'Unknown error'}`);
    }
  },

  // --- QUIZZES ---
  getQuizzes: async (): Promise<Quiz[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) {
        console.warn("getQuizzes: User not authenticated");
        return [];
      }

      // Policy will handle if teacher (own) or student (assigned)
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          teacher:teacher_id(full_name),
          questions (*),
          quiz_resources (*),
          quiz_assignments (id, student_email, student_name, status, invited_at)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error getQuizzes:', JSON.stringify(error, null, 2));
        if (error.code === '42P17') {
          console.error("CRITICAL: Infinite recursion detected. Please run the 'fix_database_error.sql' script in Supabase.");
        }
        return [];
      }

      // Transform relations to match Quiz interface with safe defaults
      return data.map((q: any) => ({
        id: q.id,
        teacher_id: q.teacher_id,
        // Handle joined data safely
        teacher_name: q.teacher?.full_name || 'Unknown Teacher',
        title: q.title,
        description: q.description,
        language: q.language,
        status: q.status,
        // Robust merge of settings
        settings: { ...DEFAULT_SETTINGS, ...(q.settings || {}) },
        created_at: q.created_at,
        ai_prompt: q.ai_prompt,
        questions: q.questions,
        resources: q.quiz_resources || [],
        invites: q.quiz_assignments?.map((qa: any) => ({
          id: qa.id,
          name: qa.student_name,
          email: qa.student_email,
          status: qa.status,
          invited_at: qa.invited_at
        })) || []
      })) as Quiz[];
    }

    // Fallback
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.QUIZZES);
    return data ? JSON.parse(data) : [];
  },

  saveQuiz: async (quiz: Quiz): Promise<void> => {
    console.log("saveQuiz called, checking Supabase configuration...");

    if (isSupabaseConfigured && supabase) {
      console.log("Supabase configured");

      // Use teacher_id from quiz object instead of auth check to avoid timeout
      if (!quiz.teacher_id) {
        throw new Error("Quiz must have a teacher_id");
      }

      console.log("Using teacher_id from quiz:", quiz.teacher_id);

      console.log("=== SAVE QUIZ START ===");
      console.log("Quiz ID:", quiz.id);
      console.log("Title:", quiz.title);
      console.log("Questions count:", quiz.questions.length);
      console.log("Resources count:", quiz.resources?.length || 0);

      try {
        // 1. Upsert Quiz
        console.log("Step 1: Saving quiz metadata...");

        const upsertPromise = supabase
          .from('quizzes')
          .upsert({
            id: quiz.id,
            teacher_id: quiz.teacher_id,
            title: quiz.title,
            description: quiz.description,
            language: quiz.language,
            status: quiz.status,
            settings: quiz.settings,
            ai_prompt: quiz.ai_prompt,
          });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Quiz metadata save timeout after 30 seconds')), 30000)
        );

        const { error: quizError } = await Promise.race([upsertPromise, timeoutPromise]) as any;

        if (quizError) {
          console.error("Error saving quiz metadata:", JSON.stringify(quizError, null, 2));
          if (quizError.code === '42P17') {
            throw new Error("Database Logic Error: Infinite Recursion. Please run 'fix_database_error.sql' in Supabase SQL Editor.");
          }
          throw new Error(`Failed to save quiz: ${quizError.message}`);
        }
        console.log("✓ Quiz metadata saved successfully");
      } catch (err) {
        console.error("FAILED at Step 1 (Quiz metadata):", err);
        throw err;
      }

      // 2. Handle Questions (Delete old, insert new)
      try {
        console.log("Step 2: Deleting old questions...");
        const { error: deleteError } = await supabase.from('questions').delete().eq('quiz_id', quiz.id);
        if (deleteError) {
          console.error("Error clearing old questions:", deleteError);
          throw deleteError;
        }
        console.log("✓ Old questions deleted");
      } catch (err) {
        console.error("FAILED at Step 2 (Delete old questions):", err);
        throw err;
      }

      // IMPORTANT: Must preserve Question IDs to maintain link with existing submissions!
      const questionsToInsert = quiz.questions.map(q => ({
        id: q.id,
        quiz_id: quiz.id,
        text: q.text,
        type: q.type,
        options: q.options || [],
        correct_answer: typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : q.correct_answer,
        points: q.points,
        explanation: q.explanation,
        media_url: q.media_url,
        svg_content: q.svg_content,
        option_visuals: q.option_visuals
      }));

      console.log(`Preparing to insert ${questionsToInsert.length} questions`);

      // Check for potentially large data
      questionsToInsert.forEach((q, idx) => {
        const questionSize = JSON.stringify(q).length;
        if (questionSize > 100000) { // >100KB
          console.warn(`Question ${idx + 1} is large: ${Math.round(questionSize / 1024)}KB`);
        }
      });

      if (questionsToInsert.length > 0) {
        // Insert questions in smaller batches to avoid timeout/payload size issues
        // Reduced to 5 per batch for better reliability with large questions
        const BATCH_SIZE = 5;
        const totalBatches = Math.ceil(questionsToInsert.length / BATCH_SIZE);

        for (let i = 0; i < questionsToInsert.length; i += BATCH_SIZE) {
          const batch = questionsToInsert.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;

          const batchSize = JSON.stringify(batch).length;
          console.log(`Inserting batch ${batchNum}/${totalBatches} (${batch.length} questions, ${Math.round(batchSize / 1024)}KB)...`);

          try {
            const { error: qError, data } = await supabase.from('questions').insert(batch);
            if (qError) {
              console.error(`Error in batch ${batchNum}:`, qError);
              console.error('Failed batch data:', JSON.stringify(batch, null, 2));
              throw new Error(`Failed to save questions batch ${batchNum}: ${qError.message}`);
            }
            console.log(`✓ Batch ${batchNum}/${totalBatches} saved successfully`);

            // Add small delay between batches to avoid rate limiting
            if (batchNum < totalBatches) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (err: any) {
            console.error(`Exception in batch ${batchNum}:`, err);
            throw err;
          }
        }
        console.log(`✓ All ${questionsToInsert.length} questions saved successfully`);
      }

      // 3. Handle Resources
      try {
        console.log("Step 3: Saving resources...");
        await supabase.from('quiz_resources').delete().eq('quiz_id', quiz.id);
        if (quiz.resources && quiz.resources.length > 0) {
          const resourcesToInsert = quiz.resources.map(r => ({
            quiz_id: quiz.id,
            name: r.name,
            type: r.type,
            url: r.url
          }));
          await supabase.from('quiz_resources').insert(resourcesToInsert);
          console.log(`✓ ${quiz.resources.length} resources saved`);
        } else {
          console.log("✓ No resources to save");
        }
      } catch (err) {
        console.error("FAILED at Step 3 (Resources):", err);
        throw err;
      }

      // 4. Handle Invites (Assignments)
      // Note: We now have a separate addInvites function, but keeping this for legacy sync
      if (quiz.invites && quiz.invites.length > 0) {
        const invitesToUpsert = quiz.invites.map(inv => ({
          quiz_id: quiz.id,
          student_email: inv.email,
          student_name: inv.name,
          status: inv.status,
          invited_at: inv.invited_at
        }));

        const { error: invError } = await supabase
          .from('quiz_assignments')
          .upsert(invitesToUpsert, { onConflict: 'quiz_id,student_email' });

        if (invError) console.warn("Invite upsert warning:", invError);
      }

      console.log("=== SAVE QUIZ COMPLETE ===");
      console.log(`✓ Successfully saved quiz "${quiz.title}" with ${quiz.questions.length} questions`);
      return;
    }

    // Fallback: Local Storage
    const quizzes = await dbService.getQuizzes();
    const idx = quizzes.findIndex(q => q.id === quiz.id);
    if (idx >= 0) {
      quizzes[idx] = quiz;
    } else {
      quizzes.push(quiz);
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
  },

  deleteQuiz: async (quizId: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log("Attempting to delete quiz:", quizId);

      // Supabase will handle cascading deletes via foreign key constraints
      // But we'll explicitly delete related data to be safe

      // 1. Delete submissions
      await supabase.from('submissions').delete().eq('quiz_id', quizId);

      // 2. Delete assignments
      await supabase.from('quiz_assignments').delete().eq('quiz_id', quizId);

      // 3. Delete resources
      await supabase.from('quiz_resources').delete().eq('quiz_id', quizId);

      // 4. Delete questions
      await supabase.from('questions').delete().eq('quiz_id', quizId);

      // 5. Delete quiz
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('teacher_id', user.id); // Ensure only owner can delete

      if (error) {
        console.error("Error deleting quiz:", error);
        throw new Error(`Failed to delete quiz: ${error.message}`);
      }

      console.log("Quiz deleted successfully");
      return;
    }

    // Fallback: Local Storage
    const quizzes = await dbService.getQuizzes();
    const filtered = quizzes.filter(q => q.id !== quizId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.QUIZZES, JSON.stringify(filtered));
  },

  // --- INVITES ---
  addInvites: async (quizId: string, invites: QuizInvite[]): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      const invitesToInsert = invites.map(inv => ({
        quiz_id: quizId,
        student_email: inv.email,
        student_name: inv.name,
        status: inv.status,
        invited_at: inv.invited_at
      }));

      // Use upsert to avoid unique constraint errors if re-inviting
      const { error } = await supabase
        .from('quiz_assignments')
        .upsert(invitesToInsert, { onConflict: 'quiz_id,student_email' });

      if (error) {
        console.error("Error adding invites:", error);
        throw new Error("Failed to save invites to database.");
      }
    }
  },

  getQuizInvites: async (quizId: string): Promise<QuizInvite[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('quiz_assignments')
        .select('*')
        .eq('quiz_id', quizId);

      if (error) {
        console.error("Error fetching invites:", error);
        return [];
      }

      // Fetch profiles for these emails to get real names
      const emails = data.map((inv: any) => inv.student_email);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('email, full_name')
        .in('email', emails);

      const profileMap = new Map();
      if (profiles) {
        profiles.forEach((p: any) => profileMap.set(p.email, p.full_name));
      }

      return data.map((inv: any) => ({
        id: inv.id,
        name: profileMap.get(inv.student_email) || inv.student_name || 'Pending Student',
        email: inv.student_email,
        status: inv.status,
        invited_at: inv.invited_at
      }));
    }
    return [];
  },

  acceptInvite: async (quizId: string, email: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      // Update status only if currently pending
      const { error } = await supabase
        .from('quiz_assignments')
        .update({ status: 'ACCEPTED' })
        .eq('quiz_id', quizId)
        .eq('student_email', email)
        .eq('status', 'PENDING');

      if (error) console.warn("Failed to accept invite", error);
    }
  },

  // --- SUBMISSIONS ---

  submitQuiz: async (quizId: string, answers: any, score: number, questions: any[]): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Quiz Settings to determine status
      const { data: quizData } = await supabase.from('quizzes').select('settings').eq('id', quizId).single();
      const settings = { ...DEFAULT_SETTINGS, ...(quizData?.settings || {}) };

      // 2. Determine Status
      const hasEssay = questions.some(q => q.type === QuestionType.ESSAY);
      // IF 'Manual Mode' OR 'Show Results Immediately' is DISABLED => Set to PENDING_REVIEW
      const forceManual = settings.grading_mode === 'MANUAL' || settings.show_results_immediately === false;

      const status = (hasEssay || forceManual) ? 'PENDING_REVIEW' : 'GRADED';

      const { error } = await supabase.from('submissions').insert({
        quiz_id: quizId,
        student_id: user.id,
        score: score,
        answers: answers,
        status: status
      });

      if (error) console.error("Error submitting quiz:", error);

      // 4. Update invite status to COMPLETED
      await supabase.from('quiz_assignments')
        .update({ status: 'COMPLETED' })
        .eq('quiz_id', quizId)
        .eq('student_email', user.email);
    }
  },

  gradeSubmission: async (submissionId: string, newScore: number, gradingDetails: Record<string, number>, questions: Question[]): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      // Transform gradingDetails from Record<string, number> to Array format with max_points
      const gradingDetailsArray = questions.map(q => ({
        question_id: q.id,
        points_awarded: gradingDetails[q.id] || 0,
        max_points: q.points
      }));

      const { error } = await supabase
        .from('submissions')
        .update({
          score: newScore,
          status: 'GRADED',
          grading_details: gradingDetailsArray
        })
        .eq('id', submissionId);

      if (error) {
        console.error("Error grading submission:", error);
        throw new Error("Failed to save grades.");
      }
    }
  },

  getStudentAttempts: async (quizId: string): Promise<number> => {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId)
        .eq('student_id', user.id);

      if (error) console.error("Error getting attempts:", error);

      return count || 0;
    }
    return 0;
  },

  getQuizSubmissions: async (quizId: string): Promise<Submission[]> => {
    if (isSupabaseConfigured && supabase) {
      // Fetch submissions and join with student profiles to get names
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          student:student_id (full_name, email)
        `)
        .eq('quiz_id', quizId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error("Error fetching submissions:", error);
        return [];
      }

      return data.map((sub: any) => ({
        id: sub.id,
        quiz_id: sub.quiz_id,
        student_id: sub.student_id,
        score: sub.score,
        answers: sub.answers,
        status: sub.status,
        submitted_at: sub.submitted_at,
        grading_details: sub.grading_details, // Pass grading details to frontend
        student_name: sub.student?.full_name || 'Unknown',
        student_email: sub.student?.email || 'Unknown'
      }));
    }
    return [];
  },

  getMySubmissions: async (): Promise<Submission[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) return [];
      return data as Submission[];
    }
    return [];
  },

  removeInvite: async (quizId: string, inviteId: string): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Remove invite requires Supabase');
      return;
    }

    try {
      const { error } = await supabase
        .from('quiz_assignments')
        .delete()
        .eq('quiz_id', quizId)
        .eq('id', inviteId);

      if (error) {
        console.error('Error removing invite:', error);
        throw error;
      }
    } catch (e) {
      console.error('Failed to remove invite:', e);
      throw e;
    }
  },

  // --- TEACHING GUIDES ---

  getGuides: async (): Promise<TeachingGuide[]> => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.GUIDES);
    return data ? JSON.parse(data) : [];
  },

  saveGuide: async (guide: TeachingGuide): Promise<void> => {
    const guides = await dbService.getGuides();
    guides.push(guide);
    localStorage.setItem(LOCAL_STORAGE_KEYS.GUIDES, JSON.stringify(guides));
  },

  // --- NOTIFICATIONS ---

  createNotification: async (notification: Omit<import('../types').Notification, 'id' | 'created_at'>): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Notifications require Supabase. Skipping notification creation.');
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          quiz_id: notification.quiz_id,
          related_user_name: notification.related_user_name,
          read: false  // Using 'read' to match existing schema
        });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (e) {
      console.error('Failed to create notification:', e);
    }
  },

  getNotifications: async (userId: string): Promise<import('../types').Notification[]> => {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      // Map 'read' to 'is_read' for consistency with our types
      return (data || []).map(n => ({
        ...n,
        is_read: n.read
      }));
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
      return [];
    }
  },

  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })  // Using 'read' to match existing schema
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
      }
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  },

  clearAllNotifications: async (userId: string): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing notifications:', error);
      }
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  },

  // --- STUDENT PROFILE ---

  getStudentProfile: async (studentId: string, teacherId: string): Promise<import('../types').StudentProfile | null> => {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      // 1. Get student user data
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (userError || !userData) {
        console.error('Error fetching student user data:', userError);
        return null;
      }

      // 2. Get student details (contact info, notes, etc.)
      const { data: detailsData, error: detailsError } = await supabase
        .from('student_details')
        .select('*')
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId)
        .maybeSingle();

      if (detailsError) {
        console.error('Error fetching student details:', detailsError);
      }

      // 3. Get quiz history
      const quizHistory = await dbService.getStudentQuizHistory(studentId, teacherId);

      // 4. Calculate statistics
      const totalInvited = quizHistory.length;
      const totalCompleted = quizHistory.filter(q => q.status === 'COMPLETED').length;
      const completedQuizzes = quizHistory.filter(q => q.status === 'COMPLETED' && q.max_score && q.max_score > 0);

      const averageScore = completedQuizzes.length > 0
        ? Math.round(
          completedQuizzes.reduce((sum, q) => {
            const percentage = ((q.score || 0) / (q.max_score || 1)) * 100;
            return sum + percentage;
          }, 0) / completedQuizzes.length
        )
        : 0;

      const completionRate = totalInvited > 0
        ? Math.round((totalCompleted / totalInvited) * 100)
        : 0;

      return {
        user: userData,
        details: detailsData || null,
        quizHistory,
        stats: {
          totalInvited,
          totalCompleted,
          averageScore,
          completionRate
        }
      };
    } catch (e) {
      console.error('Failed to get student profile:', e);
      return null;
    }
  },

  getStudentQuizHistory: async (studentId: string, teacherId: string): Promise<import('../types').QuizHistoryItem[]> => {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      // Get all quiz assignments for this student from this teacher
      const { data: assignments, error: assignError } = await supabase
        .from('quiz_assignments')
        .select(`
          quiz_id,
          student_email,
          status,
          invited_at,
          quiz:quiz_id (
            id,
            title,
            teacher_id
          )
        `)
        .eq('student_email', (await supabase.from('profiles').select('email').eq('id', studentId).single()).data?.email || '')
        .order('invited_at', { ascending: false });

      if (assignError) {
        console.error('Error fetching quiz assignments:', assignError);
        return [];
      }

      // Filter to only include quizzes from this teacher
      const teacherAssignments = (assignments || []).filter((a: any) => a.quiz?.teacher_id === teacherId);

      // For each assignment, get the submission data if completed
      const historyPromises = teacherAssignments.map(async (assignment: any) => {
        const item: import('../types').QuizHistoryItem = {
          quiz_id: assignment.quiz_id,
          quiz_title: assignment.quiz?.title || 'Unknown Quiz',
          status: assignment.status,
          invited_at: assignment.invited_at,
          score: null,
          max_score: null
        };

        // If completed, fetch the submission to get score and max_score
        if (assignment.status === 'COMPLETED') {
          const { data: submission, error: subError } = await supabase
            .from('submissions')
            .select('score, grading_details')
            .eq('quiz_id', assignment.quiz_id)
            .eq('student_id', studentId)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (subError) {
            console.error(`Error fetching submission for quiz ${assignment.quiz_id}:`, subError);
          } else if (submission) {
            item.score = submission.score || 0;

            // Calculate max_score from grading_details
            if (submission.grading_details && Array.isArray(submission.grading_details)) {
              item.max_score = submission.grading_details.reduce((sum: number, detail: any) => {
                return sum + (detail.max_points || 0);
              }, 0);
            } else {
              // Fallback: try to get max_score from questions
              const { data: questions } = await supabase
                .from('questions')
                .select('points')
                .eq('quiz_id', assignment.quiz_id);

              if (questions) {
                item.max_score = questions.reduce((sum, q) => sum + (q.points || 0), 0);
              }
            }
          }
        }

        return item;
      });

      const history = await Promise.all(historyPromises);
      return history;
    } catch (e) {
      console.error('Failed to get student quiz history:', e);
      return [];
    }
  },

  updateStudentDetails: async (studentId: string, teacherId: string, details: Partial<import('../types').StudentDetails>): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const { error } = await supabase
        .from('student_details')
        .upsert({
          student_id: studentId,
          teacher_id: teacherId,
          phone: details.phone,
          address: details.address,
          parent_name: details.parent_name,
          parent_email: details.parent_email,
          parent_phone: details.parent_phone,
          notes: details.notes
        }, {
          onConflict: 'student_id,teacher_id'
        });

      if (error) {
        console.error('Error updating student details:', error);
        throw new Error('Failed to update student details');
      }
    } catch (e) {
      console.error('Failed to update student details:', e);
      throw e;
    }
  },

  // --- TEACHER STUDENTS ---
  getTeacherStudents: async (): Promise<{ id: string; full_name: string; email: string }[]> => {
    if (!isSupabaseConfigured || !supabase) {
      return []; // Return empty in dev mode
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'STUDENT')
        .order('full_name');

      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }

      return data || [];
    } catch (e) {
      console.error('Error in getTeacherStudents:', e);
      return [];
    }
  },

  // Delete student (and all related data)
  deleteStudent: async (studentId: string): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Delete student profile (CASCADE should handle related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', studentId);

      if (error) {
        console.error('Error deleting student:', error);
        throw new Error('Failed to delete student');
      }
    } catch (e) {
      console.error('Error in deleteStudent:', e);
      throw e;
    }
  }
};

// Helper
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};