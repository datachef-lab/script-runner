export const getAllSubjects = (dataArr = []) => {
    const subjectsArr = new Set();
    for(let i = 0; i < dataArr.length; i++) {
        subjectsArr.add(dataArr[i].subject);
    }

    return subjectsArr;
}