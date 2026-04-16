# Android Testing

## Overview

| Layer | Tool | When to use |
|-------|------|-------------|
| **ViewModel unit tests** | JUnit + MockK + coroutines-test | Automated — runs on every PR via GitHub Actions; no emulator needed |
| **Instrumented UI tests** | Espresso / Compose UI | Manual — requires an emulator or physical device; deferred (see below) |

ViewModel unit tests live in `android/app/src/test/` and run on the JVM. They are fast (~30s), require no Android runtime, and are the right place to test state-machine logic in ViewModels.

---

## What's tested

| File | ViewModel | Cases covered |
|------|-----------|---------------|
| `AuthViewModelTest.kt` | `AuthViewModel` | Login success/failure, register success, `checkAuthAndGetUser` success/failure, logout calls repository, `resetState` restores Idle |
| `NotesViewModelTest.kt` | `NotesViewModel` | Load notes (fast-path Flow), load failure sets error, query/search path, createNote triggers reload, deleteNote calls repository, setType updates filter |
| `TasksViewModelTest.kt` | `TasksViewModel` | Load tasks (fast-path Flow), load failure, createTask triggers callback, moveTask updates status, `todoTasks` derived state, setSharedTab triggers shared query |
| `FlashcardsViewModelTest.kt` | `FlashcardsViewModel` | Load sets + streak, load failure, createSet triggers reload, startStudy loads cards, flipCard toggles state, answerCard increments score and advances index, answerCard on last card sets isComplete, deleteSet triggers reload |
| `CareerViewModelTest.kt` | `CareerViewModel` | Load applications (fast-path Flow), load failure, createApplication triggers callback, updateApplicationStatus updates state, deleteApplication removes from state, loadResumes emits list, `filteredApplications` derived state |

---

## How it works

**No emulator is needed.** ViewModels are pure Kotlin — they have no Android framework dependencies except `ViewModel` and `viewModelScope`. The test setup replaces `Dispatchers.Main` with `UnconfinedTestDispatcher` so coroutines run eagerly on the test thread.

**Repositories are mocked with MockK.** Concrete repository classes are mocked using `mockk<MyRepository>()`. Each test stubs only the methods it calls. Unexpected calls cause the test to fail — which keeps tests honest about what each ViewModel function actually calls.

**Flows are mocked with `flowOf(...)`.** Repository methods that return `Flow<Result<List<...>>>` (cache-first network-bound resources) are mocked to return `flowOf(Result.success(list))`. This lets tests verify that the ViewModel correctly collects the flow and updates state.

**Standard test pattern:**

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class MyViewModelTest {
    private val testDispatcher = UnconfinedTestDispatcher()
    private val repository: MyRepository = mockk()
    private val notifier = DataRefreshNotifier()    // real instance — no deps
    private lateinit var viewModel: MyViewModel

    @Before fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = MyViewModel(repository, notifier)
    }

    @After fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `loadItems success emits items`() = runTest {
        every { repository.getItems() } returns flowOf(Result.success(listOf(fakeItem())))

        viewModel.loadItems()
        advanceUntilIdle()

        assertEquals(listOf(fakeItem()), viewModel.state.value.items)
    }
}
```

---

## Running locally

```bash
cd android
./gradlew testDebugUnitTest
```

HTML reports are written to `android/app/build/reports/tests/testDebugUnitTest/`.

To run a single test class:

```bash
./gradlew testDebugUnitTest --tests "com.continuum.android.feature.notes.NotesViewModelTest"
```

---

## How to add a new ViewModel test

1. Create `android/app/src/test/java/com/continuum/android/feature/<module>/<Name>ViewModelTest.kt`
2. Copy the pattern above — mock the repository, set the main dispatcher, call `advanceUntilIdle()` after triggering ViewModel functions that launch coroutines.
3. Run `./gradlew testDebugUnitTest` — Gradle picks it up automatically.

**Tips:**
- Use `every { repo.nonSuspendFn() }` for regular functions (e.g. those returning a `Flow`).
- Use `coEvery { repo.suspendFn() }` for `suspend` functions.
- Use `coVerify { repo.suspendFn(...) }` to assert the repository was called with the right arguments.
- Use `mockk(relaxed = true)` for dependencies like `TokenManager` that have many methods you don't care about in a given test.

---

## What's not tested here

| What | Why | Alternatives |
|------|-----|-------------|
| Compose UI rendering | Requires Android runtime and an emulator or device | Espresso / Compose UI tests (deferred) |
| Navigation between screens | Navigation is tied to `NavController` which is Android-framework-specific | Manual QA |
| Real API responses | Tests mock the repository; actual HTTP responses are tested by backend Jest suite | Backend integration tests |

---

## CI

The **Android unit tests** job runs in parallel with the Jest and Playwright jobs on every PR targeting `main`. If any test fails, the `android/app/build/reports/tests/` HTML report is uploaded as an artifact for 7 days. Look for it under **Actions → your workflow run → Artifacts**.
