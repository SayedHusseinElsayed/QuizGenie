

import { Language } from './types';

export const TRANSLATIONS = {
  [Language.EN]: {
    landing: {
      nav: {
        features: "Features",
        services: "Services",
        how_it_works: "How it Works",
        pricing: "Pricing",
        about: "About",
        contact: "Contact",
        login: "Login",
        signup: "Sign Up Free"
      },
      hero: {
        badge: "New: AI Teaching Assistant 2.0",
        title: "Transform Content into",
        title_highlight: "Engaging Quizzes",
        subtitle: "Upload any PDF, image, or text. Let Gemini 3 generate professional quizzes, lesson plans, and grading insights in seconds.",
        cta_primary: "Start Creating for Free",
        cta_secondary: "Watch Demo",
        trusted_by: "Trusted by 1,000+ forward-thinking educators"
      },
      services: {
        title: "Comprehensive Education Solutions",
        subtitle: "We provide end-to-end tools to manage the entire learning lifecycle.",
        s1_title: "AI Content Transformation",
        s1_desc: "Instantly convert static textbooks, notes, and PDFs into interactive digital learning assets and quizzes.",
        s2_title: "Automated Grading Engine",
        s2_desc: "Save hours every week with our AI that grades essays, short answers, and complex problems with human-like accuracy.",
        s3_title: "Bilingual Curriculum Support",
        s3_desc: "Seamlessly toggle between Arabic and English for all generated content, ensuring inclusivity for all students.",
        s4_title: "Smart Analytics Dashboard",
        s4_desc: "Gain deep insights into student performance, identify learning gaps, and track progress over time."
      },
      problem_solution: {
        title: "Stop Wasting Time on Manual Work",
        problem_title: "The Old Way",
        problem_1: "Hours spent typing questions manually",
        problem_2: "Inconsistent grading and slow feedback",
        problem_3: "Struggling to support bilingual students",
        solution_title: "The QuizGenie Way",
        solution_1: "Instant generation from your materials",
        solution_2: "AI auto-grading with detailed explanations",
        solution_3: "Native Arabic & English support built-in"
      },
      features: {
        title: "Everything You Need to Teach Smarter",
        subtitle: "Powerful tools designed for modern education.",
        tabs: {
          quiz: "AI Quiz Gen",
          assistant: "Teaching Guide",
          analytics: "Analytics",
          grading: "Auto-Grading"
        },
        content: {
          quiz_title: "Generate Quizzes in Seconds",
          quiz_desc: "Upload your course material and let our AI craft perfect multiple-choice, true/false, and short answer questions instantly.",
          assistant_title: "Your AI Co-Pilot",
          assistant_desc: "Get lesson summaries, teaching strategies, and classroom activity ideas based on your specific curriculum.",
          analytics_title: "Deep Student Insights",
          analytics_desc: "Track performance trends, identify struggling students, and view class-wide statistics at a glance.",
          grading_title: "Effortless Grading",
          grading_desc: "Our AI grades subjective answers, provides feedback, and saves you countless hours every weekend."
        }
      },
      testimonials: {
        title: "Loved by Educators Worldwide",
        t1_text: "QuizGenie has completely transformed how I prepare for classes. What used to take me 4 hours on Sunday now takes 15 minutes.",
        t1_author: "Sarah Johnson",
        t1_role: "High School History Teacher",
        t2_text: "The bilingual support is flawless. I can generate quizzes in English for my international students and Arabic for locals instantly.",
        t2_author: "Ahmed Hassan",
        t2_role: "University Professor",
        t3_text: "The analytics helped me spot a learning gap in my math class before the final exam. A lifesaver.",
        t3_author: "Emily Chen",
        t3_role: "Department Head"
      },
      stats: {
        users: "Active Teachers",
        quizzes: "Quizzes Created",
        saved: "Hours Saved"
      },
      pricing: {
        title: "Simple, Transparent Pricing",
        free: {
          title: "Free",
          price: "$0",
          features: ["5 AI Quizzes/month", "Basic Analytics", "Email Support"]
        },
        pro: {
          title: "Pro",
          price: "$4.99",
          features: ["100 AI Quizzes/month", "Priority Support", "Custom Branding"]
        },
        school: {
          title: "School",
          price: "Custom",
          features: ["Unlimited AI Quizzes", "Admin Dashboard", "LMS Integration", "Dedicated Success Manager", "SSO"]
        }
      },
      about: {
        title: "About QuizGenie",
        subtitle: "Empowering the Next Generation of Educators",
        desc_1: "QuizGenie was born from a simple observation: Teachers spend too much time on administration and not enough time on inspiration. We are a team of educators, engineers, and designers dedicated to solving this problem.",
        desc_2: "By harnessing the power of advanced AI (Gemini 3), we provide tools that don't just automate tasks, but enhance the quality of education. Our mission is to give every teacher a superpower.",
        values: ["Innovation First", "Teacher Centric", "Global Access"]
      },
      contact: {
        title: "Get in Touch",
        subtitle: "Have questions? We'd love to hear from you.",
        name: "Full Name",
        email: "Email Address",
        message: "Message",
        submit: "Send Message"
      },
      footer: {
        desc: "The AI-First Learning Management System building the future of education.",
        links_1: "Product",
        links_2: "Company",
        links_3: "Legal",
        copyright: "© 2024 QuizGenie Inc. All rights reserved."
      }
    },
    dashboard: {
      welcome: "Welcome back,",
      stats: "Overview",
      total_students: "Total Students",
      active_quizzes: "Active Quizzes",
      pending_review: "Pending Review",
      create_quiz: "Create AI Quiz",
      teaching_assistant: "Teaching Assistant",
      students: "Students"
    },
    quiz_creator: {
      title: "AI Quiz Generator",
      upload_label: "Upload Materials (PDF, Images, Text)",
      topic_label: "Custom AI Prompt",
      grade_level_label: "Target Grade Level",
      config_section: "Question Configuration",
      generate_btn: "Generate Quiz",
      generating: "Gemini is thinking...",
      review: "Review & Edit",
      publish: "Publish Quiz",
      add_question: "Add Question",
      regenerate: "Regenerate",
      student_view: "Student View",
      editor_view: "Editor View",
      types: {
        TRUE_FALSE: "True / False",
        SINGLE_CHOICE: "Single Choice",
        MULTIPLE_CHOICE: "Multiple Choice",
        SHORT_ANSWER: "Short Answer",
        FILL_BLANK: "Fill in the Blank",
        MATCHING: "Matching",
        ORDERING: "Ordering",
        ESSAY: "Essay / Paragraph",
        NUMERICAL: "Numerical",
        GRAPHICAL: "Graphical / Visual"
      }
    },
    quiz_manager: {
      title: "Quiz Manager",
      tabs: {
        questions: "Questions",
        invitations: "Invitations",
        submissions: "Submissions",
        settings: "Settings",
        context: "AI Context & Resources"
      },
      questions_list: {
        add_btn: "Add Question",
        edit: "Edit",
        delete: "Delete",
        points: "pts"
      },
      submissions: {
        student: "Student",
        score: "Score",
        date: "Date",
        status: "Status",
        manual_grading_title: "Manual Grading",
        save_grades: "Save & Release Grades",
        points_awarded: "Points Awarded"
      },
      settings: {
        total_score: "Total Quiz Score",
        grading_mode: "Grading Mode",
        auto: "Automatic",
        manual: "Manual (Teacher Review)"
      },
      context: {
        prompt_label: "Original AI Prompt / Instructions",
        resources_label: "Uploaded Resources"
      }
    },
    quizzes_list: {
      title: "My Quizzes",
      search_placeholder: "Search quizzes...",
      columns: {
        title: "Title",
        questions: "Questions",
        created: "Created At",
        status: "Status",
        actions: "Actions"
      },
      manage_btn: "Manage"
    },
    student: {
      my_quizzes: "My Quizzes",
      start: "Start",
      score: "Score",
      completed: "Completed"
    },
    students_list: {
      title: "Students",
      subtitle: "Track student progress and performance across all quizzes",
      search_placeholder: "Search students...",
      sort_by: "Sort by",
      sort_name: "Name",
      sort_score: "Average Score",
      sort_activity: "Last Activity",
      add_student: "Add Student",
      table_student: "Student",
      table_email: "Email",
      table_quizzes: "Quizzes",
      table_score: "Avg. Score",
      table_activity: "Last Activity",
      table_actions: "Actions",
      no_students_found: "No students found matching your search",
      no_students_yet: "No students yet",
      try_different_search: "Try a different search term",
      students_will_appear: "Students will appear here once they accept quiz invitations",
      view_profile: "View Profile",
      pending: "Pending",
      not_registered: "Not registered yet",
      completed_count: "completed",
      showing_students: "Showing",
      of_students: "of",
      students: "students",
      add_modal_title: "Add New Student",
      student_email: "Student Email",
      full_name: "Full Name",
      note: "Note:",
      pending_note: "The student will appear as \"Pending\" until they register with this email address.",
      adding: "Adding..."
    },
    messages: {
      success: {
        quiz_saved: "Quiz saved successfully!",
        quiz_deleted: "Quiz deleted successfully",
        student_added: "Student added successfully! They will appear as pending until they register.",
        student_updated: "Student details updated successfully!",
        grades_saved: "Grades saved and published successfully!",
        invites_sent: "Students invited successfully",
        invite_removed: "Invitation removed successfully",
        link_copied: "Link copied to clipboard!",
        changes_saved: "Changes saved successfully!"
      },
      error: {
        login_required: "Please login to continue",
        save_failed: "Failed to save. Please try again.",
        delete_failed: "Failed to delete",
        generation_failed: "Generation failed. Please try again.",
        invalid_email: "Please enter valid email addresses",
        invalid_email_address: "Please enter a valid email address",
        file_too_large: "File size exceeds limit",
        update_failed: "Failed to update",
        cannot_remove_accepted: "Cannot remove invitations that have been accepted",
        profile_not_found: "Student profile not found. The student may not have registered yet.",
        unable_to_open_profile: "Unable to open student profile",
        fill_all_fields: "Please fill in all fields",
        student_exists: "A student with this email already exists",
        add_student_failed: "Failed to add student. Please try again."
      },
      info: {
        generating: "Generating quiz...",
        loading: "Loading...",
        processing: "Processing..."
      }
    },
    auth: {
      signup: {
        title: "Create Account",
        subtitle: "Get started for free. No credit card required.",
        hero_title: "Start your journey.",
        hero_subtitle: "Join thousands of educators and students transforming the way they learn and teach with AI.",
        trusted_by: "Trusted by 10,000+ users",
        full_name: "Full Name",
        email: "Email Address",
        password: "Password",
        teacher: "Teacher",
        student: "Student",
        sign_up_btn: "Sign Up",
        creating: "Creating Account...",
        already_have_account: "Already have an account? Login",
        check_email_title: "Check Your Email",
        check_email_message: "We've sent a confirmation link to",
        check_email_instruction: "Please click the link to verify your account and then log in.",
        go_to_login: "Go to Login",
        signup_failed: "Signup failed",
        unexpected_error: "An unexpected error occurred."
      },
      login: {
        title: "Login",
        subtitle: "Enter your credentials to access your account.",
        hero_title: "Welcome back.",
        hero_subtitle: "Log in to manage your quizzes and track student progress.",
        secure_login: "Secure Login System",
        email: "Email Address",
        password: "Password",
        login_btn: "Login",
        logging_in: "Logging in...",
        no_account: "Don't have an account? Sign Up",
        login_failed: "Login failed"
      }
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      loading: "Loading...",
      language_toggle: "العربية"
    }
  },
  [Language.AR]: {
    landing: {
      nav: {
        features: "المميزات",
        services: "الخدمات",
        how_it_works: "كيف يعمل",
        pricing: "الأسعار",
        about: "من نحن",
        contact: "تواصل معنا",
        login: "دخول",
        signup: "سجل مجاناً"
      },
      hero: {
        badge: "جديد: المساعد التعليمي الذكي 2.0",
        title: "حول محتواك التعليمي إلى",
        title_highlight: "اختبارات تفاعلية",
        subtitle: "ارفع أي ملف PDF أو صورة أو نص. دع Gemini 3 ينشئ اختبارات احترافية وخطط دروس ورؤى تقييمية في ثوانٍ.",
        cta_primary: "ابدأ مجاناً",
        cta_secondary: "شاهد العرض",
        trusted_by: "محل ثقة أكثر من 1000 معلم مبتكر"
      },
      services: {
        title: "حلول تعليمية شاملة",
        subtitle: "نوفر أدوات متكاملة لإدارة دورة التعلم بأكملها.",
        s1_title: "تحويل المحتوى بالذكاء الاصطناعي",
        s1_desc: "حول الكتب والملاحظات وملفات PDF فوراً إلى مواد تعليمية رقمية واختبارات تفاعلية.",
        s2_title: "محرك التصحيح الآلي",
        s2_desc: "وفر ساعات كل أسبوع مع الذكاء الاصطناعي الذي يصحح المقالات والإجابات القصيرة بدقة تشبه البشر.",
        s3_title: "دعم المناهج ثنائية اللغة",
        s3_desc: "بدّل بسلاسة بين العربية والإنجليزية لجميع المحتويات المولدة، مما يضمن الشمولية لجميع الطلاب.",
        s4_title: "لوحة تحكم التحليلات الذكية",
        s4_desc: "احصل على رؤى عميقة حول أداء الطلاب، وحدد فجوات التعلم، وتتبع التقدم بمرور الوقت."
      },
      problem_solution: {
        title: "توقف عن إضاعة الوقت في العمل اليدوي",
        problem_title: "الطريقة القديمة",
        problem_1: "ساعات في كتابة الأسئلة يدوياً",
        problem_2: "تصحيح غير متسق وردود فعل بطيئة",
        problem_3: "صعوبة في دعم الطلاب ثنائيي اللغة",
        solution_title: "طريقة QuizGenie",
        solution_1: "توليد فوري من موادك التعليمية",
        solution_2: "تصحيح تلقائي بالذكاء الاصطناعي مع شرح",
        solution_3: "دعم مدمج للغتين العربية والإنجليزية"
      },
      features: {
        title: "كل ما تحتاجه للتدريس بذكاء",
        subtitle: "أدوات قوية مصممة للتعليم الحديث.",
        tabs: {
          quiz: "توليد الاختبارات",
          assistant: "دليل المعلم",
          analytics: "التحليلات",
          grading: "التصحيح الآلي"
        },
        content: {
          quiz_title: "أنشئ اختبارات في ثوانٍ",
          quiz_desc: "ارفع المادة الدراسية ودع الذكاء الاصطناعي يصوغ أسئلة مثالية (اختيار من متعدد، صح/خطأ، وغيرها) فوراً.",
          assistant_title: "مساعدك الذكي",
          assistant_desc: "احصل على ملخصات للدروس، استراتيجيات تدريس، وأفكار أنشطة صفية بناءً على منهجك المحدد.",
          analytics_title: "رؤى عميقة للطلاب",
          analytics_desc: "تتبع اتجاهات الأداء، حدد الطلاب المتعثرين، واعرض إحصائيات الفصل بلمحة سريعة.",
          grading_title: "تصحيح بلا عناء",
          grading_desc: "يقوم الذكاء الاصطناعي بتصحيح الإجابات المقالية، وتقديم ملاحظات، وتوفير ساعات من وقتك كل عطلة نهاية أسبوع."
        }
      },
      testimonials: {
        title: "محبوب من المعلمين حول العالم",
        t1_text: "لقد غير QuizGenie تماماً طريقة تحضيري للدروس. ما كان يستغرق 4 ساعات يوم الأحد أصبح يستغرق 15 دقيقة.",
        t1_author: "سارة أحمد",
        t1_role: "معلمة تاريخ",
        t2_text: "الدعم ثنائي اللغة لا تشوبه شائبة. يمكنني إنشاء اختبارات بالإنجليزية لطلابي الدوليين وبالعربية للمحليين فوراً.",
        t2_author: "د. أحمد حسن",
        t2_role: "أستاذ جامعي",
        t3_text: "ساعدتني التحليلات في اكتشاف فجوة تعليمية في فصل الرياضيات قبل الامتحان النهائي. منقذ حقيقي.",
        t3_author: "إميلي تشين",
        t3_role: "رئيسة القسم"
      },
      stats: {
        users: "معلم نشط",
        quizzes: "اختبار تم إنشاؤه",
        saved: "ساعة تم توفيرها"
      },
      pricing: {
        title: "أسعار بسيطة وشفافة",
        free: {
          title: "مجاني",
          price: "$0",
          features: ["5 اختبارات ذكية/شهر", "تحليلات أساسية", "دعم عبر البريد"]
        },
        pro: {
          title: "احترافي",
          price: "$4.99",
          features: ["100 اختبار ذكي/شهر", "دعم ذو أولوية", "هوية مخصصة"]
        },
        school: {
          title: "للمدارس",
          price: "مخصص",
          features: ["اختبارات غير محدودة", "لوحة تحكم للإدارة", "ربط مع LMS", "مدير حساب خاص", "دخول موحد (SSO)"]
        }
      },
      about: {
        title: "عن QuizGenie",
        subtitle: "تمكين الجيل القادم من المعلمين",
        desc_1: "نشأت QuizGenie من ملاحظة بسيطة: يقضي المعلمون وقتاً طويلاً في الإدارة وليس وقتاً كافياً في الإلهام. نحن فريق من المعلمين والمهندسين والمصممين المكرسين لحل هذه المشكلة.",
        desc_2: "من خلال تسخير قوة الذكاء الاصطناعي المتقدم (Gemini 3)، نوفر أدوات لا تقوم فقط بأتمتة المهام، بل تعزز جودة التعليم. مهمتنا هي إعطاء كل معلم قوة خارقة.",
        values: ["الابتكار أولاً", "التركيز على المعلم", "وصول عالمي"]
      },
      contact: {
        title: "تواصل معنا",
        subtitle: "لديك أسئلة؟ نود أن نسمع منك.",
        name: "الاسم الكامل",
        email: "البريد الإلكتروني",
        message: "الرسالة",
        submit: "إرسال الرسالة"
      },
      footer: {
        desc: "نظام إدارة التعلم الأول بالذكاء الاصطناعي لبناء مستقبل التعليم.",
        links_1: "المنتج",
        links_2: "الشركة",
        links_3: "قانوني",
        copyright: "© 2024 QuizGenie جميع الحقوق محفوظة."
      }
    },
    dashboard: {
      welcome: "مرحباً بعودتك،",
      stats: "نظرة عامة",
      total_students: "إجمالي الطلاب",
      active_quizzes: "الاختبارات النشطة",
      pending_review: "في انتظار المراجعة",
      create_quiz: "إنشاء اختبار ذكي",
      teaching_assistant: "المساعد التعليمي",
      students: "الطلاب"
    },
    quiz_creator: {
      title: "مولد الاختبارات الذكي",
      upload_label: "رفع المواد (PDF، صور، نصوص)",
      topic_label: "توجيهات الذكاء الاصطناعي (Prompt)",
      grade_level_label: "المرحلة الدراسية المستهدفة",
      config_section: "إعدادات الأسئلة",
      generate_btn: "توليد الاختبار",
      generating: "Gemini يفكر...",
      review: "مراجعة وتعديل",
      publish: "نشر الاختبار",
      add_question: "إضافة سؤال",
      regenerate: "إعادة توليد",
      student_view: "عرض الطالب",
      editor_view: "وضع التعديل",
      types: {
        TRUE_FALSE: "صح / خطأ",
        SINGLE_CHOICE: "اختيار من متعدد (إجابة واحدة)",
        MULTIPLE_CHOICE: "اختيار من متعدد (أكثر من إجابة)",
        SHORT_ANSWER: "إجابة قصيرة",
        FILL_BLANK: "املأ الفراغ",
        MATCHING: "توصيل / مطابقة",
        ORDERING: "ترتيب",
        ESSAY: "مقال / تعبير",
        NUMERICAL: "مسألة رقمية",
        GRAPHICAL: "سؤال صوري / بياني"
      }
    },
    quiz_manager: {
      title: "إدارة الاختبار",
      tabs: {
        questions: "الأسئلة",
        invitations: "الدعوات",
        submissions: "التسليمات",
        settings: "الإعدادات",
        context: "سياق الذكاء الاصطناعي والمصادر"
      },
      questions_list: {
        add_btn: "إضافة سؤال",
        edit: "تعديل",
        delete: "حذف",
        points: "نقاط"
      },
      submissions: {
        student: "الطالب",
        score: "الدرجة",
        date: "التاريخ",
        status: "الحالة",
        manual_grading_title: "التصحيح اليدوي",
        save_grades: "حفظ ونشر الدرجات",
        points_awarded: "النقاط الممنوحة"
      },
      settings: {
        total_score: "درجة الاختبار الكلية",
        grading_mode: "طريقة التصحيح",
        auto: "تلقائي",
        manual: "يدوي (مراجعة المعلم)"
      },
      context: {
        prompt_label: "توجيهات الذكاء الاصطناعي الأصلية",
        resources_label: "المصادر المرفوعة"
      }
    },
    quizzes_list: {
      title: "اختباراتي",
      search_placeholder: "بحث في الاختبارات...",
      columns: {
        title: "العنوان",
        questions: "عدد الأسئلة",
        created: "تاريخ الإنشاء",
        status: "الحالة",
        actions: "إجراءات"
      },
      manage_btn: "إدارة"
    },
    student: {
      my_quizzes: "اختباراتي",
      start: "ابدأ",
      score: "الدرجة",
      completed: "مكتمل"
    },
    students_list: {
      title: "الطلاب",
      subtitle: "تتبع تقدم الطلاب وأدائهم في جميع الاختبارات",
      search_placeholder: "بحث عن طلاب...",
      sort_by: "ترتيب حسب",
      sort_name: "الاسم",
      sort_score: "متوسط الدرجات",
      sort_activity: "آخر نشاط",
      add_student: "إضافة طالب",
      table_student: "الطالب",
      table_email: "البريد الإلكتروني",
      table_quizzes: "الاختبارات",
      table_score: "متوسط الدرجات",
      table_activity: "آخر نشاط",
      table_actions: "إجراءات",
      no_students_found: "لم يتم العثور على طلاب مطابقين لبحثك",
      no_students_yet: "لا يوجد طلاب بعد",
      try_different_search: "جرب مصطلح بحث مختلف",
      students_will_appear: "سيظهر الطلاب هنا بمجرد قبولهم دعوات الاختبار",
      view_profile: "عرض الملف الشخصي",
      pending: "معلق",
      not_registered: "لم يسجل بعد",
      completed_count: "مكتمل",
      showing_students: "عرض",
      of_students: "من",
      students: "طلاب",
      add_modal_title: "إضافة طالب جديد",
      student_email: "بريد الطالب",
      full_name: "الاسم الكامل",
      note: "ملاحظة:",
      pending_note: "سيظهر الطالب كـ \"معلق\" حتى يقوم بالتسجيل بهذا البريد الإلكتروني.",
      adding: "جار الإضافة..."
    },
    messages: {
      success: {
        quiz_saved: "تم حفظ الاختبار بنجاح!",
        quiz_deleted: "تم حذف الاختبار بنجاح",
        student_added: "تمت إضافة الطالب بنجاح! سيظهر كمعلق حتى يقوم بالتسجيل.",
        student_updated: "تم تحديث بيانات الطالب بنجاح!",
        grades_saved: "تم حفظ ونشر الدرجات بنجاح!",
        invites_sent: "تمت دعوة الطلاب بنجاح",
        invite_removed: "تمت إزالة الدعوة بنجاح",
        link_copied: "تم نسخ الرابط!",
        changes_saved: "تم حفظ التغييرات بنجاح!"
      },
      error: {
        login_required: "الرجاء تسجيل الدخول للمتابعة",
        save_failed: "فشل الحفظ. الرجاء المحاولة مرة أخرى.",
        delete_failed: "فشل الحذف",
        generation_failed: "فشل الإنشاء. الرجاء المحاولة مرة أخرى.",
        invalid_email: "الرجاء إدخال عناوين بريد إلكتروني صحيحة",
        invalid_email_address: "الرجاء إدخال عنوان بريد إلكتروني صحيح",
        file_too_large: "حجم الملف يتجاوز الحد المسموح",
        update_failed: "فشل التحديث",
        cannot_remove_accepted: "لا يمكن إزالة الدعوات المقبولة",
        profile_not_found: "لم يتم العثور على ملف الطالب. قد يكون الطالب لم يسجل بعد.",
        unable_to_open_profile: "تعذر فتح ملف الطالب",
        fill_all_fields: "الرجاء ملء جميع الحقول",
        student_exists: "يوجد طالب بهذا البريد الإلكتروني بالفعل",
        add_student_failed: "فشل إضافة الطالب. الرجاء المحاولة مرة أخرى."
      },
      info: {
        generating: "جار إنشاء الاختبار...",
        loading: "جار التحميل...",
        processing: "جار المعالجة..."
      }
    },
    auth: {
      signup: {
        title: "إنشاء حساب",
        subtitle: "ابدأ مجاناً. لا حاجة لبطاقة ائتمان.",
        hero_title: "ابدأ رحلتك.",
        hero_subtitle: "انضم إلى آلاف المعلمين والطلاب الذين يحولون طريقة التعلم والتدريس بالذكاء الاصطناعي.",
        trusted_by: "موثوق به من قبل أكثر من 10,000 مستخدم",
        full_name: "الاسم الكامل",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        teacher: "معلم",
        student: "طالب",
        sign_up_btn: "تسجيل",
        creating: "جار إنشاء الحساب...",
        already_have_account: "لديك حساب بالفعل؟ تسجيل الدخول",
        check_email_title: "تحقق من بريدك الإلكتروني",
        check_email_message: "لقد أرسلنا رابط تأكيد إلى",
        check_email_instruction: "الرجاء النقر على الرابط للتحقق من حسابك ثم تسجيل الدخول.",
        go_to_login: "الذهاب لتسجيل الدخول",
        signup_failed: "فشل التسجيل",
        unexpected_error: "حدث خطأ غير متوقع."
      },
      login: {
        title: "تسجيل الدخول",
        subtitle: "أدخل بياناتك للوصول إلى حسابك.",
        hero_title: "مرحباً بعودتك.",
        hero_subtitle: "سجل الدخول لإدارة اختباراتك وتتبع تقدم الطلاب.",
        secure_login: "نظام تسجيل دخول آمن",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        login_btn: "تسجيل الدخول",
        logging_in: "جار تسجيل الدخول...",
        no_account: "ليس لديك حساب؟ سجل الآن",
        login_failed: "فشل تسجيل الدخول"
      }
    },
    common: {
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      loading: "جار التحميل...",
      language_toggle: "English"
    }
  }
};

export const MOCK_USER = {
  id: 'user-123',
  email: 'teacher@demo.com',
  full_name: 'Dr. Sarah Ahmed',
  role: 'TEACHER',
  avatar_url: 'https://picsum.photos/200'
};
