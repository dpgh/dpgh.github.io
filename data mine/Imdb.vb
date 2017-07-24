Imports System.IO
Imports System.Net
Imports System.Web.Script.Serialization

Public Class Imdb
    Private Shared path As String = AppDomain.CurrentDomain.BaseDirectory
    Private Shared inputFileName As String = path & "files\allMovies.csv"
    Private Shared outputFileName As String = path & "files\movies.csv"
    Private Shared genresFileName As String = path & "files\genres.csv"
    Private Shared companiesFileName As String = path & "files\companies.csv"
    Private Shared countriesFileName As String = path & "files\countries.csv"
    Private Shared peopleFileName As String = path & "files\people.csv"
    Private Shared apiKey As String = "xxxxxxxxxxxxxxxx"
    Public Shared Sub extractData()
        Dim key As String = ""
        Console.WriteLine("OPERAZIONI POSSIBILI")
        Console.WriteLine("1 - Elimina i file")
        Console.WriteLine("2 - Crea i file")
        Console.WriteLine("3 - Estrai informazioni sui film")
        Console.WriteLine("4 - Estrai informazioni sui generi")
        Console.WriteLine("5 - Estrai informazioni sui paesi")
        Console.WriteLine("6 - Estrai informazioni sui registi/scrittori")
        Console.WriteLine("7 - Estrai informazioni sulle case di produzione")
        Console.WriteLine("X - Esci")
        Console.WriteLine("In attesa di input:")

        Dim esci As Boolean = False
        While Not esci
            key = Console.ReadKey().KeyChar
            Console.WriteLine()

            Select Case key
                Case "1"
                    Console.WriteLine("Tutti i file verranno eliminati. Premi un tasto qualsiasi per continuare.")
                    Console.ReadKey()
                    eliminaFile()
                Case "2"
                    Console.WriteLine("I file di output saranno creati. Premi un tasto qualsiasi per continuare.")
                    Console.ReadKey()
                    creaFile()
                Case "3"
                    If controllaFile() Then
                        Console.WriteLine("Saranno estratte le informazioni sui film. Potrebbe volerci qualche minuto. Premi un tasto qualsiasi per continuare.")
                        Console.ReadKey()
                        leggiTuttiFilm()
                    End If
                Case "4"
                    If controllaFile() Then
                        Console.WriteLine("Saranno estratte le informazioni sui generi. Potrebbe volerci qualche minuto. Premi un tasto qualsiasi per continuare.")
                        Console.ReadKey()
                        leggiDatiAppoggio(1)
                    End If
                Case "5"
                    If controllaFile() Then
                        Console.WriteLine("Saranno estratte le informazioni sui paesi. Potrebbe volerci qualche minuto. Premi un tasto qualsiasi per continuare.")
                        Console.ReadKey()
                        leggiDatiAppoggio(2)
                    End If
                Case "6"
                    If controllaFile() Then
                        Console.WriteLine("Saranno estratte le informazioni su registi/scrittori. Potrebbe volerci qualche minuto. Premi un tasto qualsiasi per continuare.")
                        Console.ReadKey()
                        leggiDatiAppoggio(3)
                    End If
                Case "7"
                    If controllaFile() Then
                        Console.WriteLine("Saranno estratte le informazioni sulle case di produzione. Potrebbe volerci qualche minuto. Premi un tasto qualsiasi per continuare.")
                        Console.ReadKey()
                        leggiDatiAppoggio(4)
                    End If
                Case "X"
                    esci = True
                Case Else
                    Console.WriteLine("Input non riconosciuto.")
            End Select
        End While

        Console.WriteLine("Premi un tasto qualsiasi per terminare.")
        Console.ReadKey()
    End Sub

    Private Shared Sub begin()

    End Sub

    Private Shared Sub eliminaFile()
        Dim n As Integer = 0
        Dim files() As String = {outputFileName, genresFileName, companiesFileName, countriesFileName}
        For i As Integer = 0 To files.Length - 1
            Dim fileName As String = files(i)
            If File.Exists(fileName) Then
                File.Delete(fileName)
                Console.WriteLine(fileName & " ELIMINATO.")
                n += 1
            End If
        Next

        Console.WriteLine(n & " file eliminati.")
        Console.WriteLine()
    End Sub

    Private Shared Function creaFile() As Boolean
        Dim noErrore As Boolean = True

        Dim files() As String = {outputFileName, genresFileName, companiesFileName, countriesFileName, peopleFileName}
        Dim headers() As String = {"id,imdbId,title,release_date,original_language,vote_average,vote_count,budget,revenue,runtime,genres_id,countries_id,companies_id,year,test,binary,directors_id,writers_id", "id,name", "id,name", "id,name", "id,name,gender"}

        For i As Integer = 0 To files.Length - 1
            Dim fileName As String = files(i)
            Dim header As String = headers(i)
            Dim fileCreato As Boolean = creaFile(fileName, header)
            If fileCreato Then
                Console.WriteLine(fileName & " CREATO.")
            Else
                Console.WriteLine("ERRORE: impossibile creare il file " & fileName & ".")
            End If
            noErrore = noErrore And fileCreato
        Next

        Console.WriteLine()
        Return noErrore
    End Function


    Private Shared Function controllaFile() As Boolean
        Dim noErrore As Boolean = True
        'controlla che il file di input esista
        If Not File.Exists(inputFileName) Then
            Console.WriteLine("ERRORE: Impossibile trovare il file di input " & inputFileName & ".")
            noErrore = False
        End If
        'controlla che il file di output non esista
        If Not File.Exists(outputFileName) Then
            Console.WriteLine("ERRORE: Il file di output " & outputFileName & " esiste già.")
            noErrore = False
        End If
        'controlla che il file dei generi non esista
        If Not File.Exists(genresFileName) Then
            Console.WriteLine("ERRORE: Il file dei generi " & genresFileName & " esiste già.")
            noErrore = False
        End If
        'controlla che il file dei paesi non esista
        If Not File.Exists(genresFileName) Then
            Console.WriteLine("ERRORE: Il file dei paesi " & countriesFileName & " esiste già.")
            noErrore = False
        End If
        'controlla che il file delle compagnie non esista
        If Not File.Exists(genresFileName) Then
            Console.WriteLine("ERRORE: Il file delle compagnie " & companiesFileName & " esiste già.")
            noErrore = False
        End If

        Return noErrore
    End Function

    Private Shared Function creaFile(ByVal fileName As String, ByVal header As String) As Boolean
        Dim noErrore As Boolean = True
        Dim fs As FileStream = File.Create(fileName)
        Dim info As Byte() = New Text.UTF8Encoding(True).GetBytes("")
        fs.Write(info, 0, info.Length)
        fs.Close()
        If Not IO.File.Exists(fileName) Then
            noErrore = False
        End If
        If noErrore Then
            'aggiunge lo header
            appendLine(fileName, header)
        End If
        Return noErrore
    End Function

    Private Shared Sub appendLine(ByVal fileName As String, ByVal line As String)
        'aggiunge la riga in fondo al file 
        Dim file As New System.IO.StreamWriter(fileName, True)
        file.WriteLine(line)
        file.Close()
    End Sub

    Private Shared Function leggiTuttiFilm() As Boolean
        Dim rowNumber As Integer = 2 'la riga 1 è header, 2 è la prima riga di dati
        Dim totalNumberOfRows As Integer = getNumberOfLinesInFile(inputFileName)
        Dim termina As Boolean = False
        Console.WriteLine()

        While Not termina
            Try
                Dim fileFinito As Boolean = False
                Dim imdb_id As String = ""
                Dim test As String = ""
                getMovieId(rowNumber, fileFinito, imdb_id, test)
                If String.IsNullOrEmpty(imdb_id) Then
                    rowNumber += 1
                    Continue While
                End If
                'se ha letto l'imdbId del file continua. Altrimenti il file è stato letto per intero.
                If Not fileFinito Then
                    Console.SetCursorPosition(0, Console.CursorTop)
                    Console.Write(rowNumber - 1 & "/" & totalNumberOfRows)
                    'ottiene le informazioni relative all'id recuperato
                    Dim info As Dictionary(Of String, Object) = getMovieInfo(imdb_id)


                    'converte in una stringa e la aggiunge al file csv di output
                    Dim infoString As String = movieInfoToString(imdb_id, test, info)
                    If Not String.IsNullOrEmpty(infoString) Then
                        appendLine(outputFileName, infoString)
                    End If
                    rowNumber += 1

                Else
                    'segnala quando il file è finito e termina
                    Console.WriteLine("Il file è stato letto per intero.")
                    termina = True
                End If
            Catch ex As Exception
                Console.WriteLine("Errore: " & ex.Message)
                termina = True
            End Try
        End While

    End Function

    Private Shared Function getNumberOfLinesInFile(ByVal fileName As String) As Integer
        Dim n As Integer = 0
        Dim sr As New System.IO.StreamReader(fileName)
        Do While sr.Peek <> -1
            sr.ReadLine()
            n += 1
        Loop
        Return n
    End Function

    Private Shared Sub getMovieId(ByVal numRiga As Integer, ByRef fileFinito As Boolean, ByRef imdb_id As String, ByRef test As String)
        'ottiene l'id della riga richiesta. Se numRiga supera il numero totale di righe nel file, fileFinito è settato a True.
        Dim line As String = ""

        Dim sr As New System.IO.StreamReader(inputFileName)
        Do While sr.Peek <> -1 And numRiga > 0
            line = sr.ReadLine
            numRiga -= 1
        Loop

        'il file conteneva meno righe di quella specificata
        fileFinito = numRiga > 0

        Dim separators() As String = {","}
        'Dim cols() As String = line.Split(separators, StringSplitOptions.None)
        Dim m As Text.RegularExpressions.MatchCollection = System.Text.RegularExpressions.Regex.Matches(line, "(""[^""]+""|[^,]+|[^,]+)")


        imdb_id = m(0).Value
        While imdb_id.Length < 7
            imdb_id = "0" & imdb_id
        End While
        imdb_id = "tt" & imdb_id

        test = m(4).ToString
    End Sub

    Private Shared Function getMovieInfo(ByVal imdb_id As String) As Dictionary(Of String, Object)
        'resituisce le informazioni del film associato all'id passato come parametro.
        'status contiene lo stato della risposta del server.
        Dim idConvertito As String = convertiId(imdb_id)
        Dim data As Dictionary(Of String, Object)
        If Not String.IsNullOrEmpty(idConvertito) Then

            Dim letto As Boolean = False
            While Not letto
                Try
                    Dim serializer As New JavaScriptSerializer
                    Dim url As String = "https://api.themoviedb.org/3/movie/" & idConvertito & "?api_key=" & apiKey & "&language=en-US"

                    Dim request As WebRequest = WebRequest.Create(url)
                    Dim response As WebResponse = request.GetResponse()
                    Dim dataStream As Stream = response.GetResponseStream()
                    Dim reader As New StreamReader(dataStream)
                    Dim responseFromServer As String = reader.ReadToEnd()
                    reader.Close()
                    response.Close()

                    data = serializer.DeserializeObject(responseFromServer)
                    Dim crew As Dictionary(Of String, Object) = getMovieCrewInfo(idConvertito)
                    data.Add("crew", crew)
                    letto = True

                Catch ex As Exception
                    'aspetta dieci secondi e riprova
                    Threading.Thread.Sleep(10000)
                End Try
            End While
        End If
        Return data
    End Function


    Public Shared Function getMovieCrewInfo(ByVal id As String) As Dictionary(Of String, Object)
        'resituisce le informazioni del film associato all'id passato come parametro. Dim data As Dictionary(Of String, Object)
        Dim data As Dictionary(Of String, Object)
        Dim letto As Boolean = False
        While Not letto
            Try
                Dim serializer As New JavaScriptSerializer
                Dim url As String = "https://api.themoviedb.org/3/movie/" & id & "/credits?api_key=" & apiKey

                Dim request As WebRequest = WebRequest.Create(url)
                Dim response As WebResponse = request.GetResponse()
                Dim dataStream As Stream = response.GetResponseStream()
                Dim reader As New StreamReader(dataStream)
                Dim responseFromServer As String = reader.ReadToEnd()
                reader.Close()
                response.Close()

                data = serializer.DeserializeObject(responseFromServer)

                letto = True

            Catch ex As Exception
                Return Nothing
            End Try
        End While
        Return data
    End Function


    Public Shared Function movieInfoToString(ByVal id As String, ByRef test As String, ByRef movieInfo As Dictionary(Of String, Object)) As String
        'trasforma le informazioni ottenute dal server in una stringa per il file csv di output.
        'l'ordine rispecchia quello dello header inserito nel file
        Dim s As String
        Dim provider As System.Globalization.CultureInfo = System.Globalization.CultureInfo.InvariantCulture

        Dim imdbId As String = ""
        Dim title As String = ""
        Dim release_dateS As String = ""
        Dim year As String = ""
        Dim original_language As String = ""
        Dim vote_average As String = ""
        Dim vote_count As String = ""
        Dim budget As String = ""
        Dim revenue As String = ""
        Dim runtime As String = ""
        Dim genresString As String = ""
        Dim countriesString As String = ""
        Dim companiesString As String = ""
        Dim directorString As String = ""
        Dim writerString As String = ""

        If Not movieInfo Is Nothing Then
            id = movieInfo("id")
            imdbId = movieInfo("imdb_id")
            title = movieInfo("title")
            If title.Contains(",") Then
                title = """" & title & """"
            End If
            Dim release_date As Date
            Try
                release_date = Date.ParseExact(movieInfo("release_date"), "yyyy-MM-dd", provider)
                release_dateS = release_date.ToString("dd/MM/yyyy")
                year = release_date.Year
            Catch ex As Exception
                release_dateS = ""
                year = ""
            End Try
            original_language = movieInfo("original_language")
            vote_average = movieInfo("vote_average")
            vote_count = movieInfo("vote_count")
            budget = movieInfo("budget")
            revenue = movieInfo("revenue")
            runtime = movieInfo("runtime")
            Dim genres() As Object = movieInfo("genres")
            Dim countries() As Object = movieInfo("production_countries")
            Dim companies() As Object = movieInfo("production_companies")

            'concatena i generi separandoli con spazio
            Dim sep As String = ""
            For Each genre As Dictionary(Of String, Object) In genres
                genresString &= sep & genre("id")
                sep = " "
            Next

            'concatena i paesi separandoli con spazio
            sep = ""
            For Each country As Dictionary(Of String, Object) In countries
                countriesString &= sep & country("iso_3166_1")
                sep = " "
            Next

            'concatena le compagnie separandole con spazio
            sep = ""
            For Each company As Dictionary(Of String, Object) In companies
                companiesString &= sep & company("id")
                sep = " "
            Next



            Dim directorSep As String = ""
            Dim writerSep As String = ""

            If Not movieInfo("crew") Is Nothing AndAlso Not movieInfo("crew")("crew") Is Nothing Then

                Dim crew() As Object = movieInfo("crew")("crew")
                For Each crewMember As Dictionary(Of String, Object) In crew
                    If Not String.IsNullOrEmpty(crewMember("job")) Then
                        Dim jobName As String = crewMember("job").Trim.ToLower
                        If jobName = "director" Or jobName = "writer" Or jobName = "screenplay" Then
                            Dim crewMemberId As String = crewMember("id")
                            Dim crewMemberName As String = crewMember("name")
                            Dim crewMemberGender As String = crewMember("gender")

                            Select Case jobName
                                Case "director"
                                    directorString &= directorSep & crewMemberId
                                    directorSep = " "
                                Case "writer", "screenplay"
                                    writerString &= writerSep & crewMemberId
                                    writerSep = " "
                            End Select
                        End If
                    End If
                Next

            End If

            Dim binary As String = ""
            Select Case test
                Case 0
                    test = "nowomen"
                    binary = "FAIL"
                Case 1
                    test = "notalk"
                    binary = "FAIL"
                Case 2
                    test = "men"
                    binary = "FAIL"
                Case 3
                    test = "pass"
                    binary = "PASS"
            End Select

            s = id & "," & imdbId & "," & title & "," & release_dateS & "," & original_language & "," & vote_average & "," & vote_count & "," & budget & "," & revenue & "," & runtime & "," & genresString & "," & countriesString & "," & companiesString & "," & year & "," & test & "," & binary & "," & directorString & "," & writerString
        End If
        Return s
    End Function


    Private Shared Function convertiId(ByVal imdbId As String) As String
        'restituisce l'id di themoviedb che corrisponde all'id imdb
        Dim idConvertito As String = ""
        Dim letto As Boolean = False
        While Not letto
            Try
                Dim serializer As New JavaScriptSerializer
                Dim url As String = "https://api.themoviedb.org/3/find/" & imdbId & "?api_key=" & apiKey & "&language=en-US&external_source=imdb_id"

                Dim request As WebRequest = WebRequest.Create(url)
                Dim response As WebResponse = request.GetResponse()
                Dim dataStream As Stream = response.GetResponseStream()
                Dim reader As New StreamReader(dataStream)
                Dim responseFromServer As String = reader.ReadToEnd()
                reader.Close()
                response.Close()

                Dim data As Dictionary(Of String, Object)
                data = serializer.DeserializeObject(responseFromServer)

                Dim movie As Dictionary(Of String, Object)
                Dim movieResults() As Object = data("movie_results")

                'se non c'è nulla in movieResults (potrebbe essere una serie o altro)
                If movieResults.Length > 0 Then
                    idConvertito = movieResults(0)("id")
                End If

                letto = True

            Catch ex As Exception
                'aspetta dieci secondi e riprova
                Threading.Thread.Sleep(10000)
            End Try
        End While
        Return idConvertito
    End Function

    Private Shared Function leggiDatiAppoggio(ByVal tipo As Integer) As Boolean
        Dim rowNumber As Integer = 2 'la riga 1 è header, 2 è la prima riga di dati
        Dim totalNumberOfRows As Integer = getNumberOfLinesInFile(inputFileName)
        Dim termina As Boolean = False
        Console.WriteLine()

        Dim genres As New ArrayList
        Dim countries As New ArrayList
        Dim companies As New ArrayList
        Dim people As New ArrayList

        While Not termina
            Try
                Dim genres_id As String = ""
                Dim countries_id As String = ""
                Dim companies_id As String = ""
                Dim directors_id As String = ""
                Dim writers_id As String = ""
                Dim fileFinito As Boolean = False
                getDetailsId(rowNumber, fileFinito, genres_id, countries_id, companies_id, directors_id, writers_id)
                If Not fileFinito Then
                    Console.SetCursorPosition(0, Console.CursorTop)
                    Console.Write("Lettura dal file dei film: " & rowNumber - 1 & "/" & totalNumberOfRows)
                    rowNumber += 1

                    Dim genresS() As String = genres_id.Split(" ")
                    Dim countriesS() As String = countries_id.Split(" ")
                    Dim companiesS() As String = companies_id.Split(" ")
                    Dim directorsS() As String = directors_id.Split(" ")
                    Dim writersS() As String = writers_id.Split(" ")

                    For Each s As String In genresS
                        If Not genres.Contains(s) And Not String.IsNullOrEmpty(s) Then
                            genres.Add(s)
                        End If
                    Next
                    For Each s As String In countriesS
                        If Not countries.Contains(s) And Not String.IsNullOrEmpty(s) Then
                            countries.Add(s)
                        End If
                    Next
                    For Each s As String In companiesS
                        If Not companies.Contains(s) And Not String.IsNullOrEmpty(s) Then
                            companies.Add(s)
                        End If
                    Next
                    For Each s As String In directorsS
                        If Not people.Contains(s) And Not String.IsNullOrEmpty(s) Then
                            people.Add(s)
                        End If
                    Next
                    For Each s As String In writersS
                        If Not people.Contains(s) And Not String.IsNullOrEmpty(s) Then
                            people.Add(s)
                        End If
                    Next

                Else
                    'segnala quando il file è finito e termina
                    Console.WriteLine()
                    Console.WriteLine("Il file è stato letto per intero.")
                    termina = True
                End If
            Catch ex As Exception
                Throw
            End Try
        End While

        Console.WriteLine()
        Select Case tipo
            Case 1
                'generi


            Case 2
                'paesi
                For Each countryId As String In countries
                    appendLine(countriesFileName, countryId & ",")
                Next
            Case 3
                'persone
                For i As Integer = 0 To people.Count - 1
                    Dim personId As String = people(i)
                    Dim letto As Boolean = False
                    While Not letto
                        Try
                            Dim serializer As New JavaScriptSerializer
                            Dim url As String = "https://api.themoviedb.org/3/person/" & personId & "?api_key=" & apiKey

                            Dim request As WebRequest = WebRequest.Create(url)
                            Dim response As WebResponse = request.GetResponse()
                            Dim dataStream As Stream = response.GetResponseStream()
                            Dim reader As New StreamReader(dataStream)
                            Dim responseFromServer As String = reader.ReadToEnd()
                            reader.Close()
                            response.Close()

                            Dim data As Dictionary(Of String, Object)
                            data = serializer.DeserializeObject(responseFromServer)

                            Dim name As String = Replace(data("name"), """", "")
                            If name.Contains(",") Then
                                name = """" & name & """"
                            End If
                            Dim gender As String = data("gender")

                            appendLine(peopleFileName, personId & "," & name & "," & gender)

                            letto = True

                        Catch ex As Exception
                            'aspetta dieci secondi e riprova
                            Threading.Thread.Sleep(10000)
                        End Try

                        Console.SetCursorPosition(0, Console.CursorTop)
                        Console.Write("Persone importate: " & i + 1 & "/" & people.Count)
                    End While
                Next
                Console.WriteLine()
                Console.WriteLine("Finito.")
            Case 4
                'case produzione
                For i As Integer = 0 To companies.Count - 1
                    Dim companyId As String = companies(i)
                    Dim letto As Boolean = False
                    While Not letto
                        Try
                            Dim serializer As New JavaScriptSerializer
                            Dim url As String = "https://api.themoviedb.org/3/company/" & companyId & "?api_key=" & apiKey

                            Dim request As WebRequest = WebRequest.Create(url)
                            Dim response As WebResponse = request.GetResponse()
                            Dim dataStream As Stream = response.GetResponseStream()
                            Dim reader As New StreamReader(dataStream)
                            Dim responseFromServer As String = reader.ReadToEnd()
                            reader.Close()
                            response.Close()

                            Dim data As Dictionary(Of String, Object)
                            data = serializer.DeserializeObject(responseFromServer)

                            Dim name As String = Replace(data("name"), """", "")
                            If name.Contains(",") Then
                                name = """" & name & """"
                            End If

                            appendLine(companiesFileName, companyId & "," & name)

                            letto = True

                        Catch ex As Exception
                            'aspetta dieci secondi e riprova
                            Threading.Thread.Sleep(10000)
                        End Try

                        Console.SetCursorPosition(0, Console.CursorTop)
                        Console.Write("Compagnie importate: " & i + 1 & "/" & companies.Count)
                    End While
                Next
                Console.WriteLine()
                Console.WriteLine("Finito.")

        End Select

    End Function


    Private Shared Sub getDetailsId(ByVal numRiga As Integer, ByRef fileFinito As Boolean, ByRef genres_id As String, ByRef countries_id As String, ByRef companies_id As String, ByRef directors_id As String, ByRef writers_id As String)
        Dim line As String = ""

        Dim sr As New System.IO.StreamReader(outputFileName)
        Do While sr.Peek <> -1 And numRiga > 0
            line = sr.ReadLine
            numRiga -= 1
        Loop

        'il file conteneva meno righe di quella specificata
        fileFinito = numRiga > 0

        Dim line2 As String = Text.RegularExpressions.Regex.Replace(line, """[^""]*""", "titolo")
        Dim separators() As String = {","}
        Dim cols() As String = line2.Split(separators, StringSplitOptions.None)

        genres_id = cols(10).ToString
        countries_id = cols(11).ToString
        companies_id = cols(12).ToString
        directors_id = cols(16).ToString
        writers_id = cols(17).ToString

    End Sub
End Class
